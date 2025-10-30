import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { extractData } from './helpers';
import request from './request';

const urls = {
  repository: (id: number) => `/repositories/${id}`,
  root: (repositoryId: number) => `${urls.repository(repositoryId)}/content-elements`,
  resource: (repositoryId: number, id: number) => `${urls.root(repositoryId)}/${id}`,
  reorder: (repositoryId: number, id: number) =>
    `${urls.resource(repositoryId, id)}/reorder`,
};

function fetch(repositoryId: number, params: { ids: number[] }) {
  return request.get(urls.root(repositoryId), { params }).then(extractData);
}

function create(payload: ContentElement) {
  return request
    .post(urls.root(payload.repositoryId), payload)
    .then(extractData);
}

function patch(
  repositoryId: number,
  id: number,
  data: Partial<ContentElement>,
) {
  return request.patch(urls.resource(repositoryId, id), data).then(extractData);
}

function reorder(repositoryId: number, id: number, data: { position: number }) {
  return request.post(urls.reorder(repositoryId, id), data).then(extractData);
}

function remove(repositoryId: number, id: number) {
  return request.delete(urls.resource(repositoryId, id));
}

export default {
  fetch,
  create,
  patch,
  reorder,
  remove,
};
