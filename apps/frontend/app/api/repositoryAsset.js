import { extractData } from './helpers';
import request from './request';

const urls = {
  repository: (repositoryId) => `/repositories/${repositoryId}`,
  root: (repositoryId) => `${urls.repository(repositoryId)}/assets`,
  resource: (repositoryId, id) => `${urls.root(repositoryId)}/${id}`,
};

function list(repositoryId) {
  return request.get(urls.root(repositoryId)).then(extractData);
}

function upload(repositoryId, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request
    .post(urls.root(repositoryId), formData, {
      headers: { 'Content-Type': undefined },
    })
    .then(extractData);
}

function updateMeta(repositoryId, id, meta) {
  return request
    .patch(urls.resource(repositoryId, id), { meta })
    .then(extractData);
}

function getDownloadUrl(repositoryId, id) {
  return request
    .get(`${urls.resource(repositoryId, id)}/download`)
    .then(extractData);
}

function remove(repositoryId, id) {
  return request.delete(urls.resource(repositoryId, id)).then(extractData);
}

function bulkRemove(repositoryId, assetIds) {
  return request
    .post(`${urls.root(repositoryId)}/bulk/remove`, { assetIds })
    .then(extractData);
}

function importFromLink(repositoryId, url, meta) {
  return request
    .post(`${urls.root(repositoryId)}/import/link`, { url, meta })
    .then(extractData);
}

function attachFile(repositoryId, assetId, fileKey, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileKey', fileKey);
  return request
    .post(`${urls.resource(repositoryId, assetId)}/file`, formData, {
      headers: { 'Content-Type': undefined },
    })
    .then(extractData);
}

function indexAssets(repositoryId, assetIds) {
  return request
    .post(`${urls.root(repositoryId)}/index`, { assetIds })
    .then(extractData);
}

function getIndexingStatus(repositoryId) {
  return request
    .get(`${urls.root(repositoryId)}/index/status`)
    .then(extractData);
}

function deindexAsset(repositoryId, assetId) {
  return request
    .delete(`${urls.resource(repositoryId, assetId)}/index`)
    .then(extractData);
}

function discover(repositoryId, query, contentFilter = 'all', count = 20) {
  return request
    .post(`${urls.root(repositoryId)}/discover`, { query, contentFilter, count })
    .then(extractData);
}

export default {
  list,
  upload,
  getDownloadUrl,
  remove,
  bulkRemove,
  updateMeta,
  importFromLink,
  attachFile,
  indexAssets,
  getIndexingStatus,
  deindexAsset,
  discover,
};
