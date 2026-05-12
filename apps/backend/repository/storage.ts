import path from 'node:path';
import BaseStorage from '#shared/storage/index.js';
import { storage as config } from '#config';

class Storage extends (BaseStorage as any) {
  getPath(...segments: string[]) {
    return path.join('repository', config.path, ...segments);
  }
}

export default await Storage.create(config);
