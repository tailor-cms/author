import { extractData } from './helpers';
import request from './request';

const urls = {
  repository: (id) => `/repositories/${id}`,
  root: (repositoryId) => `${urls.repository(repositoryId)}/content-elements`,
  resource: (repositoryId, id) => `${urls.root(repositoryId)}/${id}`,
  reorder: (repositoryId, id) => `${urls.resource(repositoryId, id)}/reorder`,
  call: (repositoryId, id, action) =>
    `${urls.resource(repositoryId, id)}/call/${action}`,
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

function call(repositoryId, id, action, payload = {}) {
  return request
    .post(urls.call(repositoryId, id, action), payload)
    .then(extractData);
}

export default {
  fetch,
  create,
  patch,
  reorder,
  remove,
  call,
};
