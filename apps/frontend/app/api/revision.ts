import type { Entity } from '@tailor-cms/interfaces/revision';
import { extractData } from './helpers';
import request from './request';

interface FetchParams {
  entity?: Entity;
  entityId?: number;
  offset?: number;
  limit?: number;
}

const urls = {
  root: (repositoryId: number) => `/repositories/${repositoryId}/revisions`,
  timeTravel: (repositoryId: number) => `${urls.root(repositoryId)}/time-travel`,
  resource: (repositoryId: number, id: number) => `${urls.root(repositoryId)}/${id}`,
};

function fetch(repositoryId: number, params: FetchParams,) {
  return request
    .get(urls.root(repositoryId), { params })
    .then((res) => res.data);
}

function getStateAtMoment(
  repositoryId: number,
  params: { activityId: number; elementIds: number[]; timestamp: string },
) {
  return request
    .get(urls.timeTravel(repositoryId), { params })
    .then(extractData);
}

function get(repositoryId: number, id: number) {
  return request
    .get(urls.resource(repositoryId, id))
    .then((res) => res.data);
}

export default {
  fetch,
  getStateAtMoment,
  get,
};
