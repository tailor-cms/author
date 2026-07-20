/**
 * Allowed extensions for image File meta inputs. Restricted to formats a
 * browser can render inline, so `showPreview` fields never show a broken
 * preview. Excludes `svg` (script-bearing), `heic`/`heif`/`tiff` (browsers
 * can't decode them), and `bmp` (renderable but uncompressed and
 * impractically large for stored assets).
 */
export const IMAGE_INPUT_EXT = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
] as const;
