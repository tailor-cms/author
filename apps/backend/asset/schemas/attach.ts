// The file itself arrives via multer (`upload.single('file')`); the
// runtime body schema (`AttachFileInput`) only validates the companion
// `fileKey` field. The full multipart wire shape (`AttachFileMultipart`)
// adds the binary file field for OpenAPI emission.
import { binaryFile } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const AttachFileInput = z.object({
  fileKey: z.string().trim().min(1).max(32).describe(oneLine`
    Key (property) name inside \`meta.files\` (e.g. \`captions\`).
    Replaces any prior file stored under this key.
  `),
}).describe('Payload for attaching a supplementary file to an asset.');

export type AttachFileInput = z.infer<typeof AttachFileInput>;

export const AttachFileMultipart = AttachFileInput.extend({
  file: binaryFile('The file blob to attach.'),
}).describe('Multipart payload for the attach-file endpoint.');
