import { extractData } from './helpers';
import request from './request';

const urls = {
  repository: (id) => `/repositories/${id}`,
  root: (repositoryId) => `${urls.repository(repositoryId)}/content-elements`,
  resource: (repositoryId, id) => `${urls.root(repositoryId)}/${id}`,
  reorder: (repositoryId, id) => `${urls.resource(repositoryId, id)}/reorder`,
  link: (repositoryId) => `${urls.root(repositoryId)}/link`,
  unlink: (repositoryId, id) => `${urls.resource(repositoryId, id)}/unlink`,
  source: (repositoryId, id) => `${urls.resource(repositoryId, id)}/source`,
  copies: (repositoryId, id) => `${urls.resource(repositoryId, id)}/copies`,
};

function fetch(repositoryId, params) {
  return request.get(urls.root(repositoryId), { params }).then(extractData);
}

function create(payload) {
  return request
    .post(urls.root(payload.repositoryId), payload)
    .then(extractData);
}

function patch(repositoryId, id, data) {
  return request.patch(urls.resource(repositoryId, id), data).then(extractData);
}

function reorder(repositoryId, id, data) {
  return request.post(urls.reorder(repositoryId, id), data).then(extractData);
}

function remove(repositoryId, id) {
  return request.delete(urls.resource(repositoryId, id));
}

function link(repositoryId, payload) {
  return request.post(urls.link(repositoryId), payload).then(extractData);
}

function unlink(repositoryId, elementId) {
  return request.post(urls.unlink(repositoryId, elementId)).then(extractData);
}

function getSource(repositoryId, elementId) {
  return request.get(urls.source(repositoryId, elementId)).then(extractData);
}

function getCopies(repositoryId, elementId) {
  return request.get(urls.copies(repositoryId, elementId)).then(extractData);
}

export default {
  fetch,
  create,
  patch,
  reorder,
  remove,
  link,
  unlink,
  getSource,
  getCopies,
};
