import Compressor from 'compressorjs';

const compressWithLibrary = (file: File, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      maxWidth: size,
      maxHeight: size,
      mimeType: 'image/jpeg',
      success: (result) => resolve(result),
      error: reject,
    });
  });
};

/**
 * Draws the image directly onto a canvas instead of going through a
 * library's own canvas-support check. Some privacy-hardened browsers
 * (e.g. Firefox's `privacy.resistFingerprinting`) randomize canvas pixel
 * read-back specifically to defeat such checks, which makes compressorjs
 * report canvas as unavailable and silently hand back the untouched
 * original file instead of a resized one.
 */
const drawToCanvas = async (file: File, size: number): Promise<Blob> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    try {
      await image.decode();
    } catch {
      throw new Error('Failed to load the selected image.');
    }
    const scale = Math.min(1, size / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image resizing is not supported in this browser.');
    }
    context.drawImage(image, 0, 0, width, height);
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

/**
 * Prepares a picked image for the cropper as a normalized JPEG object URL
 * capped to `size`. Tries compressorjs first, since it also corrects EXIF
 * orientation, but falls back to a direct canvas draw whenever compressorjs
 * bails out and hands back the untouched original (its `result` is then the
 * same object reference as `file`). Callers must revoke the returned URL.
 */
export async function prepareCropSource(
  file: File,
  size: number,
): Promise<string> {
  let blob: Blob;
  try {
    blob = await compressWithLibrary(file, size);
    if (blob === file) blob = await drawToCanvas(file, size);
  } catch {
    blob = await drawToCanvas(file, size);
  }
  return URL.createObjectURL(blob);
}
