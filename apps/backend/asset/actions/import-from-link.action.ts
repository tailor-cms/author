import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// POST /repositories/:repositoryId/assets/import/link
// Collects Open Graph metadata for the URL, optionally downloads the
// linked binary for IMAGE / PDF content types, and merges any
// caller-supplied attribution into the resulting asset.
export default defineAction({
  body: schemas.ImportFromLinkInput,
  openapi: {
    authenticated: true,
    summary: 'Create an asset from a URL',
    description: oneLine`
      Collects OG metadata; for IMAGE / PDF content types also downloads
      and stores the binary. SSRF-guarded at both validation and execution.
    `,
    responses: {
      200: {
        description: 'Created asset (link or file).',
        schema: dataEnvelope(schemas.Asset),
      },
      400: { description: 'Invalid URL or private/localhost address.' },
    },
  },
  async handler({ body, req }) {
    return service.importFromLink(
      req.repository!.id,
      req.user!.id,
      body.url,
      body.meta,
    );
  },
});
