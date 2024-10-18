import { extractData } from './helpers';
import request from './request';

const urls = {
  root: (repositoryId) => `/repositories/${repositoryId}/activities`,
  resource: (repositoryId, id) =>
    `/repositories/${repositoryId}/activities/${id}`,
  restore: (repositoryId, id) => `${urls.resource(repositoryId, id)}/restore`,
};

function getActivities(repositoryId, params) {
  return request.get(urls.root(repositoryId), { params }).then(extractData);
}

function save(activity) {
  return request
    .post(urls.root(activity.repositoryId), activity)
    .then(extractData);
}

function patch({ repositoryId, id, ...payload }) {
  return request
    .patch(urls.resource(repositoryId, id), payload)
    .then(extractData);
}

function remove(repositoryId, id) {
  return request.delete(urls.resource(repositoryId, id));
}

function restore(repositoryId, id) {
  return request.patch(urls.restore(repositoryId, id));
}

function reorder(repositoryId, id, data) {
  return request
    .post(`${urls.resource(repositoryId, id)}/reorder`, data)
    .then(extractData);
}

function clone(repositoryId, id, data) {
  return request
    .post(`${urls.resource(repositoryId, id)}/clone`, data)
    .then(extractData);
}

function publish(repositoryId, id) {
  return request
    .get(`${urls.resource(repositoryId, id)}/publish`)
    .then(extractData);
}

function createPreview(repositoryId, activityId) {
  return request
    .get(`${urls.root(repositoryId)}/${activityId}/preview`)
    .then((res) => res.data.location);
}

function updateStatus(repositoryId, id, data) {
  return request
    .post(`${urls.resource(repositoryId, id)}/status`, data)
    .then(extractData);
}

export default {
  createPreview,
  save,
  patch,
  reorder,
  clone,
  remove,
  restore,
  publish,
  getActivities,
  updateStatus,
};
