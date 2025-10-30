import type { User } from '@tailor-cms/interfaces/user';
import { extractData } from './helpers';
import request from './request';

interface UserWithGroups extends User {
  userGroupIds: number[];
}

interface FetchUsersParams {
  email?: string;
  role?: string;
  filter?: string;
  archived?: boolean;
}

function fetch(params: FetchUsersParams) {
  return request.get('/users', { params }).then(extractData);
}

function upsert(data: Partial<UserWithGroups>) {
  return request.post('/users', data).then(extractData);
}

function remove({ id }: { id: number }) {
  return request.delete(`/users/${id}`);
}

function reinvite({ id }: { id: number }) {
  return request.post(`/users/${id}/reinvite`);
}

export default {
  fetch,
  upsert,
  remove,
  reinvite,
};
