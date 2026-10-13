import { oneLine } from 'common-tags';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import * as eventBus from '#shared/events/bus.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// POST /repositories/:repositoryId/assets
// Unified upload route with two response shapes driven by which multer
// field carried the upload:
//   - `files[]` (asset library)         -> { data: Asset[] }
//   - `file`    (legacy file upload)   -> { key, publicUrl, url }
// `raw: true` so the handler returns the chosen shape verbatim.
export default defineAction({
  name: 'uploadAssets',
  raw: true,
  multipart: schemas.CreateMultipart,
  openapi: {
    authenticated: true,
    summary: 'Upload one or more assets',
    description: oneLine`
      Multipart upload. Use the \`files[]\` field for asset-library uploads
      (returns the standard data envelope) or the legacy \`file\` field for
      content-element single-file uploads (returns the storage-key shape).
    `,
    responses: {
      200: {
        description: 'Library data envelope OR legacy storage-key shape.',
        schema: schemas.CreateResponse,
      },
      400: { description: 'No files provided in the multipart body.' },
    },
  },
  async handler({ req }) {
    const { file: [storageFile] = [], files: libraryFiles = [] } =
      (req.files as Record<string, any[]>) ?? {};
    const files = storageFile ? [storageFile] : libraryFiles;
    if (!files.length) {
      return createError(StatusCodes.BAD_REQUEST, 'No files provided');
    }
    // Optional virtual folder the library batch was uploaded into.
    // Legacy single-file uploads ignore it.
    const folder = (req.body as { folder?: string })?.folder;
    const assets = await service.registerUploads(
      req.repository!.id,
      req.user!.id,
      files,
      folder,
    );
    if (storageFile) return service.getDownloadUrl(assets[0].storageKey!);
    for (const asset of assets as any[]) {
      eventBus.publish({
        type: eventBus.EventType.AssetUploaded,
        repositoryId: req.repository!.id,
        actorId: req.user!.id,
        subject: eventBus.subjectOf.asset(asset.id),
        data: { id: asset.id, name: asset.name, folder: folder ?? null },
      });
    }
    return { data: assets };
  },
});
