import * as actions from './actions/index.ts';
import { EMOJI_MAX_UPLOAD_BYTES } from '@tailor-cms/utils';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';
import express from 'express';
import multer from 'multer';

const router = express.Router();
const mount = createActionMounter(router, '/emoji', {
  tag: 'Emoji',
  group: 'Workspace',
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EMOJI_MAX_UPLOAD_BYTES, files: 1 },
});

mount
  .get('/', actions.list)
  .get('/:contentHash/image', actions.image)
  .post('/', actions.create, {
    before: [authorize(), upload.single('image')],
  })
  .delete('/:emojiId', actions.remove, { before: [authorize()] });

export default {
  path: '/emoji',
  router,
};
