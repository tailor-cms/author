import { extractData } from './helpers';
import request from './request';

const urls = {
  root: () => '/ai/generate',
};

function generate(payload) {
  return request.post(urls.root(), payload).then(extractData);
}

export default {
  generate,
};
