import axios from 'axios';
import mime from 'mime-types';
import path from 'node:path';

import type { MulterFile } from '../types.ts';

const TIMEOUT = 30_000;
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const DEFAULT_FILENAME = 'downloaded-file';

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

/**
 * Downloads a file from a URL and returns it as a MulterFile-compatible object.
 */
export async function downloadFile(url: string): Promise<MulterFile> {
  const { data, headers } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT,
    maxContentLength: MAX_SIZE,
    maxRedirects: 5,
  });
  const buffer = Buffer.from(data);
  const mimeType = (headers['content-type'] || '').split(';')[0].trim();
  let filename = extractFilename(headers['content-disposition'], url);
  if (!path.extname(filename)) {
    const ext = mime.extension(mimeType);
    if (ext) filename += `.${ext}`;
  }
  return {
    originalname: filename,
    mimetype: mimeType || 'application/octet-stream',
    size: buffer.length,
    buffer,
  };
}

/**
 * Extracts a filename from a Content-Disposition header or URL path.
 * Falls back to 'downloaded-file' if neither yields a usable name.
 */
function extractFilename(
  disposition: string | undefined,
  url: string,
): string {
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
    if (match) return decodeURIComponent(match[1].replace(/"/g, ''));
  }
  const basename = path.basename(safePathname(url));
  return basename.includes('.') ? basename : DEFAULT_FILENAME;
}
