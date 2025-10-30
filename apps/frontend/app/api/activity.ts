import type { Activity } from '@tailor-cms/interfaces/activity';
import { extractData } from './helpers';
import request from './request';

const urls = {
  root: (repositoryId: number) => `/repositories/${repositoryId}/activities`,
  resource: (repositoryId: number, id: number) =>
    `/repositories/${repositoryId}/activities/${id}`,
  restore: (repositoryId: number, id: number) =>
    `${urls.resource(repositoryId, id)}/restore`,
};

function getActivities(repositoryId: number, params?: any) {
  return request.get(urls.root(repositoryId), { params }).then(extractData);
}

function save(activity: Activity) {
  return request
    .post(urls.root(activity.repositoryId), activity)
    .then(extractData);
}

function patch({ repositoryId, id, ...payload }: Activity) {
  return request
    .patch(urls.resource(repositoryId, id), payload)
    .then(extractData);
}

function remove(repositoryId: number, id: number) {
  return request.delete(urls.resource(repositoryId, id));
}

function restore(repositoryId: number, id: number) {
  return request.patch(urls.restore(repositoryId, id));
}

function reorder(repositoryId: number, id: number, data: any) {
  return request
    .post(`${urls.resource(repositoryId, id)}/reorder`, data)
    .then(extractData);
}

function clone(repositoryId: number, id: number, data: any) {
  return request
    .post(`${urls.resource(repositoryId, id)}/clone`, data)
    .then(extractData);
}

function publish(repositoryId: number, id: number) {
  return request
    .get(`${urls.resource(repositoryId, id)}/publish`)
    .then(extractData);
}

function createPreview(repositoryId: number, activityId: number) {
  return request
    .get(`${urls.root(repositoryId)}/${activityId}/preview`)
    .then((res) => res.data.location);
}

function updateStatus(repositoryId: number, id: number, data: any) {
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
