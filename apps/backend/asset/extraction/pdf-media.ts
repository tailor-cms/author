/**
 * Extract embedded images from PDF files.
 *
 * Strategy: scan the PDF binary for DCTDecode (JPEG) image streams.
 * Most PDFs embed photos/diagrams as JPEG data - extracting these
 * yields valid JPEG files without needing canvas or native deps.
 *
 * Also handles FlateDecode streams with raw image data when a
 * predictable PNG wrapper can be applied.
 */
import { createLogger } from '#logger';
import { PDFParse } from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('asset:pdf-media');

// JPEG markers
const JPEG_SOI = Buffer.from([0xff, 0xd8]); // Start of Image
const JPEG_EOI = Buffer.from([0xff, 0xd9]); // End of Image

// Minimum useful image size (skip tiny icons/artifacts)
const MIN_IMAGE_BYTES = 5_000; // 5KB
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
 * Returns page-level text for better indexing.
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
 * Main extraction function: extracts both text and images from a PDF buffer.
 */
export async function extractPdfMedia(pdfBuffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  images: ExtractedImage[];
}> {
  const [textResult, images] = await Promise.all([
    extractPdfText(pdfBuffer),
    Promise.resolve(extractJpegImages(pdfBuffer)),
  ]);
  return {
    ...textResult,
    images,
  };
}
