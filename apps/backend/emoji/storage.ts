import { storage as config } from '#config';
import BaseStorage from '#shared/storage/index.js';
import path from 'node:path';

// Emoji are platform-wide, so they sit beside the repository
// tree rather than inside any one repository's folder.
class EmojiStorage extends (BaseStorage as any) {
  getPath(...segments: string[]) {
    return path.join('emoji', ...segments);
  }
}

export default await EmojiStorage.create(config);
