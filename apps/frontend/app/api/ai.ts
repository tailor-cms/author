import type { AiContext } from '@tailor-cms/interfaces/ai';
import { extractData } from './helpers';
import request from './request';

const urls = {
  root: '/ai/generate',
};

function generate(context: AiContext) {
  return request.post(urls.root, context).then(extractData);
}

export default {
  generate,
};
