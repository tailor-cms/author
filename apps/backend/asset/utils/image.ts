import imageSize from 'image-size';

export interface ImageDimensions {
  width: number;
  height: number;
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
