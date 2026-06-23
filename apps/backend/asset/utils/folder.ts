// Asset-library folders are virtual: a `/`-delimited path stored in
// `meta.folder` (no separate model, no physical key nesting). This mirrors how
// the S3 console derives folders from key prefixes; a folder "exists" only
// because some asset carries its path. Root is the empty string.
const MAX_DEPTH = 10;
const MAX_SEGMENT = 80;
const MAX_PATH = 200;

// Matches ASCII control characters (stripped from folder names).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

// Normalizes arbitrary user input into a safe folder path. Trims segments,
// drops empties / `.` / `..` (no traversal), strips control characters, and
// caps depth and length. Returns '' for root (also for unusable input), so
// callers can treat falsy as "no folder".
export function normalizeFolder(input?: string | null): string {
  if (!input) return '';
  const segments = String(input)
    .split('/')
    // keep spaces (folder names may contain them); only strip control chars
    .map((segment) => segment.replace(CONTROL_CHARS, '').trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .map((segment) => segment.slice(0, MAX_SEGMENT))
    .slice(0, MAX_DEPTH);
  return segments.join('/').slice(0, MAX_PATH);
}
