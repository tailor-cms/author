import { extractData } from './helpers';
import request from './request';

const urls = {
  generate: (repositoryId) =>
    `/repositories/${repositoryId}/ai/generate`,
  agentRun: (repositoryId) =>
    `/repositories/${repositoryId}/agent/run`,
  agentSessions: (repositoryId) =>
    `/repositories/${repositoryId}/agent/sessions`,
  agentSession: (repositoryId, id) =>
    `${urls.agentSessions(repositoryId)}/${id}`,
};

function generate(repositoryId, payload) {
  return request.post(urls.generate(repositoryId), payload).then(extractData);
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
  runAgent,
  listAgentSessions,
  createAgentSession,
  getAgentSession,
  deleteAgentSession,
};
