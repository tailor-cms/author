import { readFile, sha256 } from './util.js';
import { storage as config } from '../../config/server/index.js';
import fromPairs from 'lodash/fromPairs.js';
import JSZip from 'jszip';
import mime from 'mime-types';
import path from 'node:path';
import pickBy from 'lodash/pickBy.js';
import request from 'axios';
import { v4 as uuidv4 } from 'uuid';

import Storage from '../../repository/storage.js';

const { getFileUrl, getPath, saveFile } = Storage;
const getStorageUrl = (key) => `${config.protocol}${key}`;

class StorageService {
  // Prefix key with custom protocol. e.g. storage://sample_key.ext
  getStorageUrl = (key) => `${config.protocol}${key}`;

  async uploadFile(repositoryId, file, name) {
    const buffer = await readFile(file);
    const hash = sha256(file.originalname, buffer);
    const extension = path.extname(file.originalname);
    const fileName = `${hash}___${name}${extension}`;
    const key = path.join(getPath(repositoryId), fileName);
    await saveFile(key, buffer, { ContentType: file.mimetype });
    const publicUrl = await getFileUrl(key);
    return { key, publicUrl, url: getStorageUrl(key) };
  }

  async uploadArchiveContent(repositoryId, archive, name) {
    const buffer = await readFile(archive);
    const content = await JSZip.loadAsync(buffer);
    const files = pickBy(content.files, (it) => !it.dir);
    const keys = await Promise.all(
      Object.keys(files).map(async (src) => {
        const key = path.join(getPath(repositoryId), name, src);
        const file = await content.file(src).async('uint8array');
        const mimeType = mime.lookup(src);
        await saveFile(key, Buffer.from(file), { ContentType: mimeType });
        return [key, getStorageUrl(key)];
      }),
    );
    return fromPairs(keys);
  }

  async downloadToStorage(url) {
    const res = await request.get(url, { responseType: 'arraybuffer' });
    const filename = path.join(
      getPath(),
      `${uuidv4()}__${url.pathname.split('/').pop()}`,
    );
    await Storage.saveFile(filename, res.data);
    return getStorageUrl(filename);
  }
}

export default new StorageService();
