// In-process cache of in-flight export jobs keyed by jobId. Shared by
// the three export actions (initiate / status / download) because they
// span separate HTTP requests against the same job.
//
// Lives here because it is cross-action state
export const JobCache = new Map<string, any>();
