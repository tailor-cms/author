import axios from 'axios';
import dns from 'node:dns/promises';
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

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((r) => r.test(ip));
}

// SSRF guard - validates protocol, hostname, and resolved IPs.
// Resolves DNS to prevent rebinding attacks where a public hostname
// resolves to a private IP at request time.
async function assertPublicUrl(url: string): Promise<void> {
  const { protocol, hostname } = new URL(url);
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }
  if (config.allowPrivateUrls) return;
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error('Requests to localhost are not allowed');
  }
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Requests to private IP addresses are not allowed');
    }
    return;
  }
  // Resolve hostname and check all returned IPs
  const { address } = await dns.lookup(hostname);
  if (isPrivateIp(address) || BLOCKED_HOSTS.has(address)) {
    throw new Error('Hostname resolves to a private IP address');
  }
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

// Downloads a file from a URL and returns a MulterFile-compatible object.
//
// Pipeline:
// 1. SSRF check (protocol, hostname, resolved IP)
// 2. HTTP GET with size/timeout/redirect limits
// 3. Extract MIME type from Content-Type header
// 4. Derive filename from Content-Disposition header or URL path
// 5. Append extension from MIME type if filename has none
export async function downloadFile(url: string): Promise<MulterFile> {
  await assertPublicUrl(url);
  const { data, headers } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT,
    maxContentLength: MAX_SIZE,
    maxRedirects: 5,
  });
  const buffer = Buffer.from(data);
  // "text/html; charset=utf-8" → "text/html"
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

// Extracts a filename from a Content-Disposition header or URL path.
// Falls back to 'downloaded-file' if neither yields a usable name.
//
// Content-Disposition header formats (RFC 6266 / RFC 5987):
//   filename="report.pdf"        → report.pdf
//   filename=report.pdf          → report.pdf
//   filename*=UTF-8''r%C3%A9sum%C3%A9.pdf → résumé.pdf
//
// Regex breakdown:
//   filename\*?          - "filename" or "filename*" (RFC 5987 extended)
//   =                    - literal equals
//   (?:UTF-8''|"?)       - optional UTF-8'' prefix or opening quote
//   ([^";]+)             - capture the filename (stop at quote, semicolon)
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
