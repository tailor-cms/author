// Wire shapes for the repository import / export endpoints.
import { z } from 'zod';

import {
  IntArrayFromForm,
  RepositoryScopedParams,
  binaryFile,
} from '#shared/request/schemas.ts';
import { Repository } from './entity.ts';

export const ImportInput = z
  .object({
    name: Repository.shape.name,
    description: z
      .string()
      .max(2000)
      .optional()
      .describe('Leave empty to inherit the archived repository description.'),
    userGroupIds: IntArrayFromForm().describe(
      'Optional list of user-group ids to share the imported repo with.',
    ),
  })
  .describe('Import-repo payload accompanying the multipart archive.');

export type ImportInput = z.infer<typeof ImportInput>;

export const ImportMultipart = ImportInput.extend({
  archive: binaryFile('Repository archive (`.tgz`).'),
}).describe('Multipart payload for the repository import endpoint.');

export const ExportJobItemParams = RepositoryScopedParams.extend({
  jobId: z
    .string()
    .min(1)
    .describe('Export job id returned by `/export/setup`.'),
}).describe('Path params for the export-job status / download endpoints.');

export type ExportJobItemParams = z.infer<typeof ExportJobItemParams>;

// GET /repositories/:repositoryId/export/setup
export const ExportInitiateResult = z
  .string()
  .meta({ id: 'RepositoryExportInitiateResult' })
  .describe('Job id the caller polls /status with and downloads via.');

export type ExportInitiateResult = z.infer<typeof ExportInitiateResult>;

// GET /repositories/:repositoryId/export/:jobId/status
export const ExportStatusResult = z
  .object({
    isCompleted: z
      .boolean()
      .describe('True when the export archive is ready for download.'),
  })
  .meta({ id: 'RepositoryExportStatusResult' })
  .describe('Polling response for an in-flight export job.');

export type ExportStatusResult = z.infer<typeof ExportStatusResult>;
