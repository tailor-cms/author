import { extractData } from './helpers';
import request from './request';

const urls = {
  root: '/user-group',
  resource: (id) => `${urls.root}/${id}`,
};

function fetch(params) {
  return request.get(urls.root, { params }).then(extractData);
}

function create(data) {
  return request.post(urls.root, data).then(extractData);
}

function patch(data) {
  return request.post(urls.resource(data.id), data).then(extractData);
}

function remove(id) {
  return request.delete(urls.resource(id));
}

export default {
  fetch,
  create,
  patch,
  remove,
};
