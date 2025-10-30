import type { ActivityContext } from '@/stores/user-tracking';
import { extractData } from './helpers';
import request from './request';

const urls = {
  root: (repositoryId: number) => `/repositories/${repositoryId}/feed`,
  subscribe: (repositoryId: number) => `${urls.root(repositoryId)}/subscribe`,
};

function fetch(repositoryId: number) {
  return request.get(urls.root(repositoryId)).then(extractData);
}

function start(context: ActivityContext) {
  return request.post(urls.root(context.repositoryId), { context });
}

function end(context: ActivityContext) {
  return request.delete(urls.root(context.repositoryId), { data: { context } });
}

export default {
  urls,
  fetch,
  start,
  end,
};
