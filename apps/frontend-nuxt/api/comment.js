import { extractData } from './helpers';
import request from './request';

const urls = {
  repository: (repositoryId) => `/repositories/${repositoryId}`,
  root: (repositoryId) => `${urls.repository(repositoryId)}/comments`,
  resource: (repositoryId, id) => `${urls.root(repositoryId)}/${id}`,
  resolve: (repositoryId) => `${urls.root(repositoryId)}/resolve`,
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

function remove(repositoryId, id) {
  return request.delete(urls.resource(repositoryId, id)).then(extractData);
}

function resolve(repositoryId, data) {
  return request.post(urls.resolve(repositoryId), data).then(extractData);
}

export default {
  fetch,
  create,
  patch,
  remove,
  resolve,
};
