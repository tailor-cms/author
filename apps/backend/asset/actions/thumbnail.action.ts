import { StatusCodes } from 'http-status-codes';
import { oneLine } from 'common-tags';

import * as schemas from '../schemas/index.ts';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { resolveThumbnailUrl } from '../thumbnail.service.ts';

export default defineAction({
  name: 'getThumbnail',
  params: schemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'Redirect to an asset thumbnail',
    description: oneLine`
      Generates and caches a WebP thumbnail on first request, then
      302-redirects to it. Uploaded images are shrunk; video links (YouTube)
      and links with an OpenGraph preview are fetched and cached. SVG and
      undecodable images redirect to the original. Assets with no image
      representation (audio, documents, plain links) return 415.
    `,
    responses: {
      302: { description: 'Redirect to the thumbnail (or original) image URL.' },
      404: { description: 'Asset not found in this repository.' },
      415: { description: 'Asset has no image representation.' },
    },
  },
  async handler({ req, res }) {
    const asset = req.asset!;
    const url = await resolveThumbnailUrl(asset);
    if (!url) {
      const msg = `Asset ${asset.id} has no image thumbnail`;
      return createError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, msg);
    }
    return res.redirect(StatusCodes.MOVED_TEMPORARILY, url);
  },
});
