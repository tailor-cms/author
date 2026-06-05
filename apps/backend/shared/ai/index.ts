import express from 'express';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { pdfUpload, validatePdfFiles } from './middleware.ts';

const router = express.Router();

// Sidebar order tracks mounter declaration order.
const GROUP = 'AI';

const generation = createActionMounter(router, '/ai', {
  tag: 'Generation', group: GROUP,
});

const vectorStore = createActionMounter(router, '/ai', {
  tag: 'Vector store', group: GROUP,
});

generation.post('/generate', actions.generate);

vectorStore
  .post('/upload', actions.upload, {
    before: [pdfUpload.array('files', 10), validatePdfFiles],
  })
  .get('/vector-store/:vectorStoreId/status', actions.getVectorStoreStatus)
  .delete('/vector-store/:vectorStoreId', actions.deleteVectorStore);

export default { path: '/ai', router };
