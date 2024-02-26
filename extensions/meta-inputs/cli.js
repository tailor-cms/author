import cli from '@tailor-cms/extension-installer';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export default cli(__dirname, 'meta inputs');
