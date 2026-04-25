import { extractData } from './helpers';
import request from './request';

const urls = {
  rpc: (repositoryId, type, procedure) =>
    `/repositories/${repositoryId}/rpc/${type}/${procedure}`,
};

function rpc(repositoryId, type, procedure, payload = {}) {
  return request.post(urls.rpc(repositoryId, type, procedure), payload)
    .then(extractData);
}

export default { rpc };
