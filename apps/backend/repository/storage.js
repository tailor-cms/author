import path from 'node:path';
import BaseStorage from '../shared/storage/index.js';
import { storage as config } from '../config/server/index.js';

class Storage extends BaseStorage {
  getPath() {
    return path.join('repository', config.path);
  }
}

export default await Storage.create(config);
