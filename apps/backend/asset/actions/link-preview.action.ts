import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { getLinkPreview } from '../extraction/link-preview.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';

export default defineAction({
  name: 'getLinkPreview',
  query: schemas.LinkPreviewFilter,
  openapi: {
    authenticated: true,
    summary: 'Describe a URL',
    description: oneLine`
      Collects OG metadata for a pasted link and names the service where
      the URL gives it away.
    `,
    responses: {
      200: {
        description: 'Link description.',
        schema: dataEnvelope(schemas.LinkPreview),
      },
      400: { description: 'Invalid URL or private/localhost address.' },
    },
  },
  async handler({ query }) {
    return getLinkPreview(query.url);
  },
});
