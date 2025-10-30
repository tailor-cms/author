import type { UserGroup } from '@tailor-cms/interfaces/user-group';
import { extractData } from './helpers';
import request from './request';

const urls = {
  root: '/user-group',
  resource: (id: number) => `${urls.root}/${id}`,
  groupUsers: (id: number) => `${urls.root}/${id}/users`,
};

function fetch(params: {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  offset: number;
  limit: number;
  filter: string;
}) {
  return request.get(urls.root, { params }).then(extractData);
}

function create(data: UserGroup) {
  return request.post(urls.root, data).then(extractData);
}

function get(id: number) {
  return request.get(urls.resource(id)).then(extractData);
}

function update(data: UserGroup) {
  return request.patch(urls.resource(data.id), data).then(extractData);
}

function remove(id: number) {
  return request.delete(urls.resource(id));
}

function fetchUsers(groupId: number) {
  return request.get(urls.groupUsers(groupId)).then(extractData);
}

function upsertUser(groupId: number, data: { emails: string[]; role: string }) {
  return request.post(urls.groupUsers(groupId), data).then(extractData);
}

function removeUser(groupId: number, userId: number) {
  return request.delete(`${urls.groupUsers(groupId)}/${userId}`);
}

export default {
  fetch,
  get,
  create,
  update,
  remove,
  fetchUsers,
  upsertUser,
  removeUser,
};
