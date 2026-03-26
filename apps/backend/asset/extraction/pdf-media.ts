/**
 * Extract embedded images from PDF files and save as assets.
 *
 * Strategy: scan the PDF binary for DCTDecode (JPEG) image streams.
 * Most PDFs embed photos/diagrams as JPEG data - extracting these
 * yields valid JPEG files without needing canvas or native deps.
 */
import imageSize from 'image-size';
import { createLogger } from '#logger';
import { PDFParse } from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

import Storage from '../../repository/storage.js';
import db from '#shared/database/index.js';

import { AssetType, type FileAsset } from '../asset.model.js';
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

/**
 * Extract JPEG images from a PDF, save each as an Image asset,
 * and describe via vision.
 */
export async function extractAndSaveImages(
  parentAsset: FileAsset,
  pdfBuffer: Buffer,
) {
  const images = extractJpegImages(pdfBuffer);
  if (!images.length) return;
  logger.info(
    { assetId: parentAsset.id, count: images.length },
    'Extracting images from PDF',
  );
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      const key = Storage.getPath(img.filename);
      await Storage.saveFile(key, img.buffer, { ContentType: img.mimeType });
      const created = await AssetModel.create({
        repositoryId: parentAsset.repositoryId,
        name: `${parentAsset.name} - Image ${i + 1}`,
        type: AssetType.Image,
        storageKey: key,
        meta: {
          fileSize: img.buffer.length,
          mimeType: img.mimeType,
          extension: 'jpg',
          tags: ['pdf-image'],
          source: { parentAssetId: parentAsset.id },
        },
        uploadedBy: parentAsset.uploadedBy,
      });
      describeWithVision(created).catch((err) =>
        logger.warn(
          { err: err?.message, assetId: created.id },
          'Vision failed for PDF image',
        ),
      );
    } catch (err: any) {
      logger.warn(
        { err: err.message, imageIndex: i },
        'Failed to save extracted image',
      );
    }
  }
}
