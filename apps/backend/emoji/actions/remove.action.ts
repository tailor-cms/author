import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../emoji.service.ts';

export default defineAction({
  name: 'removeEmoji',
  params: schemas.EmojiParams,
  openapi: {
    authenticated: true,
    summary: 'Remove an emoji',
    description: oneLine`
      Messages that already used the shortcode keep it and render it as
      plain text.
    `,
    responses: {
      204: { description: 'Removed.' },
      404: { description: 'No such emoji.' },
    },
  },
  async handler({ params, res }) {
    try {
      await service.remove(params.emojiId);
    } catch (error) {
      if (error instanceof service.EmojiNotFoundError) {
        return createError(StatusCodes.NOT_FOUND, 'Emoji not found');
      }
      throw error;
    }
    res.status(StatusCodes.NO_CONTENT);
  },
});
