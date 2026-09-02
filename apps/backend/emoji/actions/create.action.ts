import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../emoji.service.ts';

export default defineAction({
  name: 'createEmoji',
  body: schemas.CreateEmoji.omit({ image: true }),
  multipart: schemas.CreateEmoji,
  openapi: {
    authenticated: true,
    summary: 'Add an emoji',
    description: oneLine`
      Multipart upload of a raster image, normalised to a 128px WebP.
      Animation is preserved. SVG is refused due to security concerns.
    `,
    responses: {
      200: {
        description: 'The emoji that was added.',
        schema: dataEnvelope(schemas.Emoji),
      },
      400: { description: 'Missing image, unusable image, or bad name.' },
      409: { description: 'That shortcode is already taken.' },
    },
  },
  async handler({ body, req }) {
    if (!req.file) {
      return createError(StatusCodes.BAD_REQUEST, 'No image provided');
    }
    const { name } = body;
    try {
      return await service.create(
        { name, image: req.file.buffer },
        req.user!.id,
      );
    } catch (error) {
      if (error instanceof service.EmojiNameTakenError) {
        return createError(StatusCodes.CONFLICT, `:${name}: already exists`);
      }
      if (error instanceof service.EmojiNameInvalidError) {
        return createError(StatusCodes.BAD_REQUEST, schemas.EMOJI_NAME_RULE);
      }
      if (error instanceof service.EmojiImageInvalidError) {
        return createError(StatusCodes.BAD_REQUEST, oneLine`
          That image cannot be used. PNG, JPEG, WebP, GIF and AVIF are
          accepted, up to 2 MB.
        `);
      }
      throw error;
    }
  },
});
