import { extractData } from './helpers';
import request from './request';

const urls = {
  root: '/repositories',
  import: () => `${urls.root}/import`,
  resource: (id) => `${urls.root}/${id}`,
  clone: (id) => `${urls.resource(id)}/clone`,
  validateReferences: (id) => `${urls.resource(id)}/validate-references`,
  pin: (id) => `${urls.resource(id)}/pin`,
  publish: (id) => `${urls.resource(id)}/publish`,
  exportInit: (id) => `${urls.resource(id)}/export/setup`,
  export: (id, jobId) => `${urls.resource(id)}/export/${jobId}`,
  exportStatus: (id, jobId) => `${urls.export(id, jobId)}/status`,
  users: (id, userId = '') => `${urls.resource(id)}/users/${userId}`,
  tags: (id, tagId = '') => `${urls.resource(id)}/tags/${tagId}`,
};

function get(repositoryId, params) {
  return request.get(urls.resource(repositoryId), { params }).then(extractData);
}

function getRepositories(params) {
  return request.get(urls.root, { params }).then(({ data }) => data);
}

function create(repository) {
  return request.post(urls.root, repository).then(extractData);
}

function patch(repositoryId, data) {
  return request.patch(urls.resource(repositoryId), data).then(extractData);
}

function remove(repositoryId) {
  return request.delete(urls.resource(repositoryId));
}

function clone(repositoryId, name, description) {
  return request
    .post(urls.clone(repositoryId), { name, description })
    .then(extractData);
}

function validateReferences(repositoryId) {
  return request
    .get(urls.valvalidateReferencesidate(repositoryId))
    .then(extractData);
}

function pin(repositoryId, pin) {
  return request.post(urls.pin(repositoryId), { pin }).then(extractData);
}

function getUsers(repositoryId, params) {
  return request.get(urls.users(repositoryId), { params }).then(extractData);
}

function upsertUser(repositoryId, data) {
  return request
    .post(urls.users(repositoryId), data)
    .then((res) => extractData(res).user);
}

function removeUser(repositoryId, userId) {
  return request
    .delete(urls.users(repositoryId, userId))
    .then((res) => res.data);
}

function publishRepositoryMeta(id) {
  return request.post(urls.publish(id)).then((res) => res.data);
}

function addTag({ name, repositoryId }) {
  return request
    .post(urls.tags(repositoryId), { repositoryId, name })
    .then(extractData);
}

function removeTag({ repositoryId, tagId }) {
  return request.delete(urls.tags(repositoryId, tagId)).then(extractData);
}

function initiateExportJob(repositoryId) {
  return request.get(urls.exportInit(repositoryId)).then(extractData);
}

function getExportJobStatus(repositoryId, jobId) {
  return request.get(urls.exportStatus(repositoryId, jobId)).then(extractData);
}

function exportRepository(repositoryId, jobId, fields) {
  return request.submitForm(urls.export(repositoryId, jobId), fields);
}

function importRepository(data, options) {
  return request.post(urls.import(), data, options);
}

export default {
  get,
  getRepositories,
  create,
  patch,
  remove,
  getUsers,
  upsertUser,
  removeUser,
  clone,
  pin,
  publishRepositoryMeta,
  addTag,
  removeTag,
  initiateExportJob,
  getExportJobStatus,
  exportRepository,
  importRepository,
  validateReferences,
};
