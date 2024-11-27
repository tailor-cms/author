import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cli from '@tailor-cms/extension-installer';

const __dirname = dirname(fileURLToPath(import.meta.url));
export default cli(__dirname, 'content element', true);
