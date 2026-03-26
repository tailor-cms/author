import { extractData } from './helpers';
import request from './request';

const urls = {
  generate: () => '/ai/generate',
  upload: () => '/ai/upload',
  vectorStore: (id) => `/ai/vector-store/${id}`,
  vectorStoreStatus: (id) => `${urls.vectorStore(id)}/status`,
};

function generate(payload) {
  return request.post(urls.generate(), payload).then(extractData);
}

function upload(files, vectorStoreId) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  if (vectorStoreId) form.append('vectorStoreId', vectorStoreId);
  return request
    .post(urls.upload(), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(extractData);
}

function getVectorStoreStatus(vectorStoreId) {
  return request.get(urls.vectorStoreStatus(vectorStoreId)).then(extractData);
}

function deleteVectorStore(vectorStoreId) {
  return request.delete(urls.vectorStore(vectorStoreId)).then(extractData);
}

export default {
  generate,
  upload,
  getVectorStoreStatus,
  deleteVectorStore,
};
