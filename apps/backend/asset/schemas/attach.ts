// The file itself arrives via multer (`upload.single('file')`); this body
// schema only validates the companion `fileKey` field that tells the
// service where to slot the attachment in `meta.files`.
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const AttachFileInput = z.object({
  fileKey: z.string().trim().min(1).max(32).describe(oneLine`
    Key (property) name inside \`meta.files\` (e.g. \`captions\`).
    Replaces any prior file stored under this key.
  `),
}).describe('Payload for attaching a supplementary file to an asset.');

export type AttachFileInput = z.infer<typeof AttachFileInput>;
