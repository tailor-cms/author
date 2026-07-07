// Lifecycle status of an export job, tracked on the job instance and reported
// to clients via the export status endpoint.
export const ExportJobStatus = {
  // Queued or running; the archive isn't ready yet.
  Pending: 'pending',
  // Archive is packed and ready to download.
  Completed: 'completed',
  // Job failed; the job's `error` carries the reason.
  Failed: 'failed',
} as const;
