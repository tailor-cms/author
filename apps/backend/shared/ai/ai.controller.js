import { StatusCodes } from 'http-status-codes';

import AIService from './ai.service.ts';

async function generate({ body }, res) {
  const data = await AIService.generate(body);
  return res.json({ data });
}

async function upload({ files, body }, res) {
  const data = await AIService.vectorStore.upload(files, body.vectorStoreId);
  return res.json({ data });
}

async function getVectorStoreStatus({ params }, res) {
  const data = await AIService.vectorStore.getStatus(params.vectorStoreId);
  return res.json({ data });
}

async function deleteVectorStore({ params }, res) {
  await AIService.vectorStore.deleteStore(params.vectorStoreId);
  return res.sendStatus(StatusCodes.NO_CONTENT);
}

export default {
  generate,
  upload,
  getVectorStoreStatus,
  deleteVectorStore,
};
