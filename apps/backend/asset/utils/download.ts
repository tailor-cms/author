import axios from 'axios';
import { general as config } from '#config';
import { isIP } from 'node:net';
import mime from 'mime-types';
import path from 'node:path';

import type { MulterFile } from '../types.ts';

const TIMEOUT = 30_000;
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const DEFAULT_FILENAME = 'downloaded-file';
const BLOCKED_HOSTS = new Set(['localhost', '[::1]']);
const PRIVATE_IP_RANGES = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^0\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/, /^fd/,
];

/**
 * SSRF guard - rejects URLs with private/internal IP literals or localhost.
 * Hostnames that resolve via DNS (e.g. internal service names) are allowed
 * since they can't be guessed by external attackers. Input-layer validation
 * in asset.validation.ts provides the first line of defense.
 */
function assertPublicUrl(url: string): void {
  const { protocol, hostname } = new URL(url);
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }
  if (config.allowPrivateUrls) return;
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error('Requests to localhost are not allowed');
  }
  if (isIP(hostname) && PRIVATE_IP_RANGES.some((r) => r.test(hostname))) {
    throw new Error('Requests to private IP addresses are not allowed');
  }
}

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
  assertPublicUrl(url);
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
