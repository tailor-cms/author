export const AssetType = {
  Image: 'image',
  Document: 'document',
  Video: 'video',
  Audio: 'audio',
  Link: 'link',
  Other: 'other',
} as const;

export type AssetType = typeof AssetType[keyof typeof AssetType];

export const ProcessingStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type ProcessingStatus = typeof ProcessingStatus[keyof typeof ProcessingStatus];
