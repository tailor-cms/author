import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../emoji.service.ts';

const ONE_YEAR = 60 * 60 * 24 * 365;

export default defineAction({
  name: 'getEmojiImage',
  raw: true,
  params: schemas.ImageParams,
  openapi: {
    authenticated: true,
    summary: 'Fetch an emoji image',
    description: 'Emojis are served from our own origin.',
    responses: {
      200: { description: 'The image, as WebP.' },
      404: { description: 'No such emoji.' },
    },
  },
  async handler({ params, res }) {
    let image;
    try {
      image = await service.readImage(params.contentHash);
    } catch (error) {
      if (error instanceof service.EmojiNotFoundError) {
        return createError(StatusCodes.NOT_FOUND, 'Emoji not found');
      }
      throw error;
    }
    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
    res.set('X-Content-Type-Options', 'nosniff');
    return res.send(image.body);
  },
});
