import { oneLine } from 'common-tags';

// Thrown when an export can't bundle every asset file referenced by the
// library (assets.json); typically because a file is missing from storage.
// The message is client-safe and surfaced as the export job's failure reason;
export class IncompleteExportError extends Error {
  constructor(missing, total) {
    super(oneLine`
      Export failed: ${missing.length} of ${total} asset files are missing
      from storage and could not be bundled.
    `);
    this.name = 'IncompleteExportError';
    this.missing = missing;
  }
}

// Client-safe failure reason for an export job.
export function clientExportError(err) {
  return err instanceof IncompleteExportError
    ? err.message
    : 'Export failed. Please try again later.';
}
