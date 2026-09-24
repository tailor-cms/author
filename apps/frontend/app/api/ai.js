import { extractData } from './helpers';
import request from './request';

const urls = {
  generate: (repositoryId) =>
    `/repositories/${repositoryId}/ai/generate`,
  agentRuns: (repositoryId) =>
    `/repositories/${repositoryId}/agent/runs`,
  agentRun: (repositoryId, id) => `${urls.agentRuns(repositoryId)}/${id}`,
  agentSessions: (repositoryId) =>
    `/repositories/${repositoryId}/agent/sessions`,
  agentSession: (repositoryId, id) =>
    `${urls.agentSessions(repositoryId)}/${id}`,
};

function generate(repositoryId, payload) {
  return request.post(urls.generate(repositoryId), payload).then(extractData);
}

function startAgentRun(repositoryId, payload) {
  return request.post(urls.agentRuns(repositoryId), payload).then(extractData);
}

function getAgentRun(repositoryId, id, params) {
  return request
    .get(urls.agentRun(repositoryId, id), { params })
    .then(extractData);
}

function cancelAgentRun(repositoryId, id) {
  return request.post(`${urls.agentRun(repositoryId, id)}/cancel`);
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
  startAgentRun,
  getAgentRun,
  cancelAgentRun,
  listAgentSessions,
  createAgentSession,
  getAgentSession,
  deleteAgentSession,
};
