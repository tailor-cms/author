import { extractData } from './helpers';
import request from './request';

const urls = {
  root: '/tags',
};

const fetch = async (params?: { associated: boolean }) => {
  const res = await request.get(urls.root, { params });
  return extractData(res);
};

export default {
  fetch,
};
