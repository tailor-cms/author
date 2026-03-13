import AIService from './ai.service.ts';

async function generate({ body }, res) {
  const data = await AIService.generate(body);
  return res.json({ data });
}

async function uploadDocuments({ files, body }, res) {
  const result = await AIService.vectorStore.upload(files, body.vectorStoreId);
  return res.json({ data: result });
}

async function getVectorStoreStatus({ params }, res) {
  const data = await AIService.vectorStore.getStatus(params.vectorStoreId);
  return res.json({ data });
}

async function deleteVectorStore({ params }, res) {
  await AIService.vectorStore.deleteStore(params.vectorStoreId);
  return res.json({ data: { success: true } });
}

export default {
  generate,
  uploadDocuments,
  getVectorStoreStatus,
  deleteVectorStore,
};
