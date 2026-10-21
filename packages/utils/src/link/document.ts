/**
 * Shows Google, Microsoft and Office document thumbs.
 * If a file isn't shared, the viewer asks the reader to sign in.
 */
import type { LinkEmbed } from './types';
import { isGoogleHost, isMicrosoftHost } from './detect';
import { LinkContentType } from '@tailor-cms/interfaces/asset';
import { parseUrl } from '../url';

const DOCS = 'https://docs.google.com';
const DRIVE = 'https://drive.google.com';
const OFFICE_VIEWER = 'https://view.officeapps.live.com/op/embed.aspx';

// `/document/d/<id>`, also under a company domain (`/a/acme.com/`), an
// account (`/u/0/`), or published to the web (`/d/e/<id>`)
const GOOGLE_FILE = /^\/(?:a\/[^/]+\/)?(\w+)\/(?:u\/\d+\/)?d\/(e\/)?([\w-]+)/;

const GOOGLE_PREVIEWS = ['document', 'spreadsheets', 'presentation'];

const GOOGLE_PUBLISHED_PAGES: Record<string, string> = {
  document: 'pub?embedded=true',
  spreadsheets: 'pubhtml?widget=true&headers=false',
  presentation: 'embed',
  forms: 'viewform?embedded=true',
};

const OFFICE_FILE = /\.(?:docx?|xlsx?|pptx?)$/i;

const createEmbed = (embedUrl: string, thumbnailUrl = ''): LinkEmbed => ({
  kind: LinkContentType.Document,
  embedUrl,
  thumbnailUrl,
});

const getGooglePreviewUrl = (app: string, id: string) => {
  if (GOOGLE_PREVIEWS.includes(app)) return `${DOCS}/${app}/d/${id}/preview`;
  if (app === 'forms') return `${DOCS}/forms/d/${id}/viewform?embedded=true`;
  return `${DRIVE}/file/d/${id}/preview`;
};

const addResourceKey = (target: string, source: URL) => {
  const key = source.searchParams.get('resourcekey');
  if (!key) return target;
  const url = new URL(target);
  url.searchParams.set('resourcekey', key);
  return url.href;
};

const getGooglePublishedEmbed = (app: string, id: string) => {
  const page = GOOGLE_PUBLISHED_PAGES[app];
  return page ? createEmbed(`${DOCS}/${app}/d/e/${id}/${page}`) : null;
};

const getGoogleEmbed = (url: URL): LinkEmbed | null => {
  const [, app = '', published, fileId] = url.pathname.match(GOOGLE_FILE) ?? [];
  if (published && fileId) return getGooglePublishedEmbed(app, fileId);
  const id = fileId ?? url.searchParams.get('id');
  if (!id) return null;
  const thumbnailUrl = `${DRIVE}/thumbnail?id=${id}&sz=w640`;
  return createEmbed(
    addResourceKey(getGooglePreviewUrl(app, id), url),
    addResourceKey(thumbnailUrl, url),
  );
};

const getMicrosoftEmbed = (url: URL): LinkEmbed => {
  const embed = new URL(url);
  embed.searchParams.set('action', 'embedview');
  return createEmbed(embed.href);
};

const getOfficeEmbed = (url: URL): LinkEmbed =>
  createEmbed(`${OFFICE_VIEWER}?src=${encodeURIComponent(url.href)}`);

export const getDocumentEmbed = (url: string): LinkEmbed | null => {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  if (isGoogleHost(parsed.hostname)) return getGoogleEmbed(parsed);
  if (isMicrosoftHost(parsed.hostname)) return getMicrosoftEmbed(parsed);
  if (OFFICE_FILE.test(parsed.pathname)) return getOfficeEmbed(parsed);
  return null;
};
