import { z } from 'zod';

export const DownloadResult = z
  .object({
    url: z.string().describe('Pre-signed download URL for the asset file.'),
  })
  .meta({ id: 'AssetDownloadResult' })
  .describe('Signed url for an asset download request.');

export type DownloadResult = z.infer<typeof DownloadResult>;
