import type { Comment } from '@tailor-cms/interfaces/comment';
import { extractData } from './helpers';
import request from './request';

const urls = {
  repository: (repositoryId: number) => `/repositories/${repositoryId}`,
  root: (repositoryId: number) => `${urls.repository(repositoryId)}/comments`,
  resource: (repositoryId: number, id: number) => `${urls.root(repositoryId)}/${id}`,
  resolve: (repositoryId: number) => `${urls.root(repositoryId)}/resolve`,
};

function fetch(
  repositoryId: number,
  params: { activityId?: number; contentElementId?: number | null },
) {
  return request.get(urls.root(repositoryId), { params }).then(extractData);
}

function create(payload: Comment) {
  return request
    .post(urls.root(payload.repositoryId), payload)
    .then(extractData);
}

function patch(repositoryId: number, id: number, data: Partial<Comment>) {
  return request.patch(urls.resource(repositoryId, id), data).then(extractData);
}

function remove(repositoryId: number, id: number) {
  return request.delete(urls.resource(repositoryId, id)).then(extractData);
}

function resolve(repositoryId: number, data: Comment) {
  return request.post(urls.resolve(repositoryId), data).then(extractData);
}

export default {
  fetch,
  create,
  patch,
  remove,
  resolve,
};
