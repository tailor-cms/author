import Compressor from 'compressorjs';

const toBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const compressWithLibrary = (file: File, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      width: size,
      height: size,
      resize: 'cover',
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
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image resizing is not supported in this browser.');
    }
    const scale = Math.max(size / image.width, size / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(
      image,
      (size - drawWidth) / 2,
      (size - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

/**
 * Resizes/crops an image file to a square JPEG data URL. Tries
 * compressorjs first, since it also corrects EXIF orientation, but falls
 * back to a direct canvas draw whenever compressorjs bails out and hands
 * back the untouched original (its `result` is then the same object
 * reference as `file`).
 */
export async function resizeAvatarImage(
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
  return toBase64(blob);
}
