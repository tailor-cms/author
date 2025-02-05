import { extractData } from './helpers';
import request from './request';

const urls = {
  root: '/user-group',
  resource: (id) => `${urls.root}/${id}`,
  groupUsers: (id) => `${urls.root}/${id}/users`,
};

function fetch(params) {
  return request.get(urls.root, { params }).then(extractData);
}

function create(data) {
  return request.post(urls.root, data).then(extractData);
}

function get(id) {
  return request.get(urls.resource(id)).then(extractData);
}

function update(data) {
  return request.patch(urls.resource(data.id), data).then(extractData);
}

function remove(id) {
  return request.delete(urls.resource(id));
}

function fetchUsers(groupId) {
  return request.get(urls.groupUsers(groupId)).then(extractData);
}

function upsertUser(groupId, data) {
  return request.post(urls.groupUsers(groupId), data).then(extractData);
}

function removeUser(groupId, userId) {
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
