/**
 * For a given URL, determine which service it belongs to and what kind
 * of content sits behind it.
 */
import { LinkContentType, LinkProvider } from '@tailor-cms/interfaces/asset';
import { findVideo, VIDEO_HOSTS } from './video';
import { parseUrl } from '../url';

export interface DetectedLink {
  provider?: LinkProvider;
  contentType?: LinkContentType;
}

type Rule = [pattern: RegExp, LinkProvider, LinkContentType];

const hostRule = (
  hosts: string[],
  provider: LinkProvider,
  contentType: LinkContentType,
): Rule => {
  const names = hosts.map((it) => it.replaceAll('.', '\\.')).join('|');
  return [new RegExp(`(?:^|\\.)(?:${names})$`, 'i'), provider, contentType];
};

const HOST_RULES: Rule[] = [
  ...Object.entries(VIDEO_HOSTS).map(([provider, hosts]) =>
    hostRule(hosts, provider as LinkProvider, LinkContentType.Video),
  ),
  hostRule(['spotify.com'], LinkProvider.Spotify, LinkContentType.Audio),
  hostRule(['soundcloud.com'], LinkProvider.SoundCloud, LinkContentType.Audio),
];

// Google and Microsoft serve every kind of document from the same host, so
// the kind is read from the path instead
const GOOGLE_PATH_RULES: Rule[] = [
  [/^\/document\//i, LinkProvider.GoogleDocs, LinkContentType.Document],
  [/^\/spreadsheets\//i, LinkProvider.GoogleSheets, LinkContentType.Document],
  [/^\/presentation\//i, LinkProvider.GoogleSlides, LinkContentType.Document],
  [/^\/forms\//i, LinkProvider.GoogleForms, LinkContentType.Document],
  [/^\/drawings\//i, LinkProvider.GoogleDrive, LinkContentType.Image],
];

// Company accounts `/a/acme.com/document/...`
const GOOGLE_DOMAIN_PREFIX = /^\/a\/[^/]+/;

const MICROSOFT_PATH_RULES: Rule[] = [
  [/^\/:w:/i, LinkProvider.MicrosoftWord, LinkContentType.Document],
  [/^\/:x:/i, LinkProvider.MicrosoftExcel, LinkContentType.Document],
  [/^\/:p:/i, LinkProvider.MicrosoftPowerPoint, LinkContentType.Document],
];

const GOOGLE_HOST = /(?:^|\.)(?:docs|drive)\.google\.com$/i;
const SHAREPOINT_HOST = /(?:^|\.)sharepoint\.com$/i;

const MICROSOFT_HOSTS = [
  SHAREPOINT_HOST,
  /(?:^|\.)onedrive\.live\.com$/i,
  /^1drv\.ms$/i,
  /(?:^|\.)officeapps\.live\.com$/i,
];

export const isGoogleHost = (hostname: string) => GOOGLE_HOST.test(hostname);

export const isMicrosoftHost = (hostname: string) =>
  MICROSOFT_HOSTS.some((it) => it.test(hostname));

const matchRule = (rules: Rule[], value: string): DetectedLink | null => {
  const rule = rules.find(([pattern]) => pattern.test(value));
  return rule ? { provider: rule[1], contentType: rule[2] } : null;
};

const detectGoogle = (pathname: string): DetectedLink => {
  const appPath = pathname.replace(GOOGLE_DOMAIN_PREFIX, '');
  return (
    matchRule(GOOGLE_PATH_RULES, appPath) ?? {
      provider: LinkProvider.GoogleDrive,
      contentType: LinkContentType.Document,
    }
  );
};

const detectMicrosoft = (hostname: string, pathname: string): DetectedLink =>
  matchRule(MICROSOFT_PATH_RULES, pathname) ?? {
    provider: SHAREPOINT_HOST.test(hostname)
      ? LinkProvider.SharePoint
      : LinkProvider.OneDrive,
    contentType: LinkContentType.Document,
  };

export const detectLinkProvider = (url: string): DetectedLink => {
  const parsed = parseUrl(url);
  if (!parsed) return {};
  const video = findVideo(url);
  if (video) {
    return { provider: video.provider, contentType: LinkContentType.Video };
  }
  const { hostname, pathname } = parsed;
  const media = matchRule(HOST_RULES, hostname);
  if (media) return media;
  if (isGoogleHost(hostname)) return detectGoogle(pathname);
  if (isMicrosoftHost(hostname)) return detectMicrosoft(hostname, pathname);
  return {};
};
