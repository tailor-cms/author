import request from './request';

const urls = {
  base: (repositoryId: number) => `/repositories/${repositoryId}/assets`,
};

function getUrl(repositoryId: number, key: string) {
  const params = { key };
  return request
    .get(urls.base(repositoryId), { params })
    .then((res) => res.data.url);
}

function upload(repositoryId: number, data: FormData) {
  return request
    .post(urls.base(repositoryId), data, {
      headers: {
        /*
        The default value of the Content-Type header is set to `application/json` inside
        the `./request.js` file, which implies the provided data will be serialized as JSON.
        Unsetting the header instructs Axios to determine the header and serialization based
        on the type of the provided data.
        https://github.com/axios/axios/issues/5556#issuecomment-1434668134
       */
        'Content-Type': undefined,
      },
    })
    .then((res) => res.data);
}

export default {
  getUrl,
  upload,
};
