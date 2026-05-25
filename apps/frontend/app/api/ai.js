import { extractData } from './helpers';
import request from './request';

const urls = {
  generate: () => '/ai/generate',
  upload: () => '/ai/upload',
  vectorStore: (id) => `/ai/vector-store/${id}`,
  vectorStoreStatus: (id) => `${urls.vectorStore(id)}/status`,
  agentRun: (repositoryId) =>
    `/repositories/${repositoryId}/agent/run`,
  agentSessions: (repositoryId) =>
    `/repositories/${repositoryId}/agent/sessions`,
  agentSession: (repositoryId, id) =>
    `${urls.agentSessions(repositoryId)}/${id}`,
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

function runAgent(repositoryId, payload) {
  return request.post(urls.agentRun(repositoryId), payload).then(extractData);
}

function listAgentSessions(repositoryId) {
  return request.get(urls.agentSessions(repositoryId)).then(extractData);
}

function createAgentSession(repositoryId, payload) {
  return request
    .post(urls.agentSessions(repositoryId), payload)
    .then(extractData);
}

function getAgentSession(repositoryId, id) {
  return request.get(urls.agentSession(repositoryId, id)).then(extractData);
}

function deleteAgentSession(repositoryId, id) {
  return request.delete(urls.agentSession(repositoryId, id)).then(extractData);
}

export default {
  generate,
  upload,
  getVectorStoreStatus,
  deleteVectorStore,
  runAgent,
  listAgentSessions,
  createAgentSession,
  getAgentSession,
  deleteAgentSession,
};
