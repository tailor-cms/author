import type { AxiosResponse } from 'axios';

export function extractData(res: AxiosResponse<any>) {
  return res.data.data;
}
