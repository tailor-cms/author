/**
 * Allowed extensions for image File meta inputs. Restricted to formats a
 * browser can render inline, so `showPreview` fields never show a broken
 * preview. Excludes `svg` (script-bearing) and `heic`/`tiff`/`bmp`
 * (not browser-renderable).
 */
export const IMAGE_INPUT_EXT = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
] as const;
