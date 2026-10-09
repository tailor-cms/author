// The file name a link ends in
import { AssetType } from '@tailor-cms/interfaces/asset.ts';
import { resolveType } from './mime.ts';
import mime from 'mime-types';

// A web page has a title of its own, which beats `index.html`
const WEB_PAGE = 'text/html';

const lastSegment = (url: string) => {
  const { pathname } = new URL(url);
  return decodeURIComponent(pathname.split('/').filter(Boolean).pop() ?? '');
};

const isFile = (mimeType: string | false) =>
  !!mimeType &&
  mimeType !== WEB_PAGE &&
  resolveType(mimeType) !== AssetType.Other;

export function fileNameFromUrl(url: string): string {
  try {
    const name = lastSegment(url);
    return isFile(mime.lookup(name)) ? name : '';
  } catch {
    // A malformed URL, or a broken escape in its path
    return '';
  }
}
