import sharp from 'sharp';
import { imageSize } from 'image-size';

// Longest edge (px) of a generated thumbnail.
const THUMBNAIL_SIZE = 400;

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Resizes an image buffer down to a small WebP thumbnail. Honors EXIF
 * orientation, never upscales, and keeps the source aspect ratio (fits
 * within a THUMBNAIL_SIZE box). Throws on an undecodable buffer, so callers
 * fall back to serving the original.
 */
export function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 72 })
    .toBuffer();
}

// Extracts width/height from an image buffer.
// Returns null for non-image or unreadable buffers.
export function extractDimensions(
  buffer: Buffer,
): ImageDimensions | null {
  try {
    const result = imageSize(buffer);
    if (result.width && result.height) {
      return { width: result.width, height: result.height };
    }
  } catch { /* non-critical */ }
  return null;
}
