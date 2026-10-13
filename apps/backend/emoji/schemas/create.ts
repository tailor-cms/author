import { EmojiName } from './entity.ts';
import { z } from 'zod';
import { binaryFile } from '#shared/request/schemas.ts';

export const CreateEmoji = z
  .object({
    name: EmojiName,
    image: binaryFile('PNG, JPEG, WebP, GIF or AVIF. SVG is refused.'),
  })
  .describe('Emoji upload payload.');
