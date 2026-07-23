/**
 * Extract content from PDF files.
 *
 * Strategy for image extraction: scan the PDF binary for DCTDecode
 * (JPEG) image streams. Most PDFs embed photos/diagrams as JPEG
 * data - extracting these yields valid JPEG files without needing
 * canvas or native deps.
 *
 * The byte-scan extraction is deliberately permissive: it pulls
 * every JPEG-shaped run from the PDF, including slide chrome
 * (templates, headers, repeated logos).
 * We rely on two filters downstream:
 * 1. Content-hash dedup - kills the N-copies-of-the-same-template
 *    flood before we pay for vision grading.
 * 2. Vision-gated import - each surviving image is graded; if
 *    vision can't classify it as instructionally meaningful
 *    (isInformative=false), the asset is deleted before it
 *    reaches the library.
 */
import { createHash } from 'crypto';
import { imageSize } from 'image-size';
import { createLogger } from '#logger';
import { PDFParse } from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

import { buildStorageKey } from '../utils/storage-key.ts';
import Storage from '../../repository/storage.ts';
import db from '#shared/database/index.js';

import { AssetType, type FileAsset } from '../models/asset.model.js';
import { describeWithVision } from './vision-describe.ts';

const logger = createLogger('asset:pdf-media');
const { Asset: AssetModel } = db;

// JPEG markers
const JPEG_SOI = Buffer.from([0xff, 0xd8]); // Start of Image
const JPEG_EOI = Buffer.from([0xff, 0xd9]); // End of Image
// Minimum size for extracted images to filter out icons/artifacts
const MIN_IMAGE_BYTES = 5_000;
const MAX_IMAGES_PER_PDF = 50;

export interface ExtractedImage {
  // Unique name for storage
  filename: string;
  // Raw image buffer (JPEG)
  buffer: Buffer;
  // MIME type
  mimeType: string;
  // Page number where image was found (1-based)
  page?: number;
  // Approximate byte position in PDF
  byteOffset: number;
}

/**
 * Extract JPEG images embedded in a PDF buffer.
 * Scans for JPEG SOI/EOI markers within PDF stream objects.
 */
export function extractJpegImages(pdfBuffer: Buffer): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  let searchStart = 0;

  while (images.length < MAX_IMAGES_PER_PDF) {
    // Find next JPEG SOI marker
    const soiIdx = pdfBuffer.indexOf(JPEG_SOI, searchStart);
    if (soiIdx === -1) break;

    // Find the matching EOI marker
    const eoiIdx = pdfBuffer.indexOf(JPEG_EOI, soiIdx + 2);
    if (eoiIdx === -1) break;

    const end = eoiIdx + 2; // Include the EOI marker
    const length = end - soiIdx;

    // Skip tiny images (icons, artifacts)
    if (length >= MIN_IMAGE_BYTES) {
      const buffer = Buffer.alloc(length);
      pdfBuffer.copy(buffer, 0, soiIdx, end);
      // Validate the extracted buffer is a valid JPEG (filters out
      // corrupted extractions from nested markers or progressive encoding)
      try {
        imageSize(buffer);
      } catch {
        logger.debug({ byteOffset: soiIdx, length }, 'Skipping invalid JPEG');
        searchStart = end;
        continue;
      }
      images.push({
        filename: `${uuidv4()}.jpg`,
        buffer,
        mimeType: 'image/jpeg',
        byteOffset: soiIdx,
      });
    }

    searchStart = end;
  }

  logger.info(
    { imageCount: images.length, pdfSize: pdfBuffer.length },
    'JPEG extraction complete',
  );
  return images;
}

/**
 * Extract JPEG images from a PDF, save each unique one as an
 * Image asset, grade it via vision, and drop assets vision
 * cannot classify as meaningful content.
 */
export async function extractAndSaveImages(
  asset: FileAsset,
  pdfBuffer: Buffer,
) {
  const images = extractJpegImages(pdfBuffer);
  if (!images.length) return;
  logger.info(
    { assetId: asset.id, count: images.length },
    'Extracting images from PDF',
  );

  const seenHashes = new Set<string>();
  let imported = 0;
  let droppedDuplicate = 0;
  let droppedNonInformative = 0;
  let droppedUngraded = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    // Cheap dedup before storage/vision spend. Without this we'd
    // upload and grade dozens of identical chrome JPEGs.
    const hash = createHash('sha1').update(img.buffer).digest('hex');
    if (seenHashes.has(hash)) {
      droppedDuplicate++;
      continue;
    }
    seenHashes.add(hash);

    let created: any;
    let storageKey: string | null;
    try {
      const built = buildStorageKey(asset.repositoryId, 'pdf-extract.jpg');
      storageKey = built.key;
      await Storage.saveFile(storageKey, img.buffer, {
        ContentType: img.mimeType,
      });
      created = await AssetModel.create({
        type: AssetType.Image,
        repositoryId: asset.repositoryId,
        storageKey,
        name: `${asset.name} - Image ${imported + 1}`,
        meta: {
          fileSize: img.buffer.length,
          mimeType: img.mimeType,
          extension: 'jpg',
          tags: ['pdf-image'],
          source: { parentAssetId: asset.id, contentHash: hash },
        },
        uploaderId: asset.uploaderId,
      });
    } catch (err: any) {
      logger.warn(
        { err: err.message, imageIndex: i },
        'Failed to save extracted image',
      );
      continue;
    }

    // Synchronous vision grading is the gate. We can't tell
    // "slide background with header on top" from a real diagram
    // without looking at the pixels - so vision IS the filter.
    let grade: Awaited<ReturnType<typeof describeWithVision>> = null;
    try {
      grade = await describeWithVision(created);
    } catch (err: any) {
      logger.warn(
        { err: err?.message, assetId: created.id },
        'Vision failed for PDF image',
      );
    }
    const drop = shouldDrop(grade);
    if (drop) {
      try {
        // force: skip paranoid soft-delete
        await created.destroy({ force: true });
        if (storageKey) await Storage.deleteFile(storageKey);
      } catch (err: any) {
        logger.warn(
          { err: err.message, assetId: created.id },
          'Failed to clean up dropped PDF image',
        );
      }
      if (drop === 'ungraded') droppedUngraded++;
      else droppedNonInformative++;
      continue;
    }
    imported++;
  }

  logger.info(
    {
      assetId: asset.id,
      extracted: images.length,
      imported,
      droppedDuplicate,
      droppedNonInformative,
      droppedUngraded,
    },
    'PDF image extraction complete',
  );
}

/**
 * Decide whether to drop a freshly-extracted PDF image.
 * - ungraded: vision couldn't grade it (disabled, no public URL,
 *   API failure). Drop conservatively - PDF byte-scan extractions
 *   are only worth keeping when something has confirmed they're
 *   instructional content.
 * - non-informative: vision graded it as slide chrome / decorative
 *   / blank / extraction debris. Drop per the explicit contract
 *   in the ImageDescription schema.
 * Returns null when the image should be kept.
 */
function shouldDrop(
  grade: Awaited<ReturnType<typeof describeWithVision>>,
): 'ungraded' | 'non_informative' | null {
  if (!grade) return 'ungraded';
  if (grade.isInformative === false) return 'non_informative';
  // Belt-and-braces: if the model marks it informative but quality
  // is "low" AND relevance is near-zero, treat as debris. Vision
  // models are sometimes too forgiving on the boolean.
  if (grade.quality === 'low' && grade.relevanceScore < 2) {
    return 'non_informative';
  }
  return null;
}

/**
 * Extract text content from PDF using pdf-parse.
 * Useful for injecting page content directly into the AI
 * context window rather than relying on vector store retrieval.
 */
export async function extractPdfText(
  pdfBuffer: Buffer,
): Promise<{ text: string; pageCount: number }> {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    return {
      text: result.text || '',
      pageCount: result.total || 0,
    };
  } catch (err: any) {
    logger.error({ err: err.message }, 'PDF text extraction failed');
    return { text: '', pageCount: 0 };
  }
}
