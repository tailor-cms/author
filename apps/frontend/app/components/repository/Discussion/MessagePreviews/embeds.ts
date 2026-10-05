import {
  getDocumentEmbed,
  getYtThumbnailUrl,
  toEmbedUrl,
} from '@tailor-cms/common/asset';

// A link shown inline: a video player or a document viewer
export interface Embed {
  src: string;
  poster?: string;
  action?: 'play' | 'open';
}

const withAutoplay = (src: string) =>
  `${src}${src.includes('?') ? '&' : '?'}autoplay=1`;

const matchVideo = (url: string): Embed | null => {
  const src = toEmbedUrl(url);
  if (!src) return null;
  return {
    src: withAutoplay(src),
    poster: getYtThumbnailUrl(url) ?? '',
    action: 'play',
  };
};

// Google and Microsoft documents, and Office files on a public host
const matchDocument = (url: string): Embed | null => {
  const found = getDocumentEmbed(url);
  if (!found) return null;
  return { src: found.embed, poster: found.poster, action: 'open' };
};

export const findEmbed = (url: string): Embed | null =>
  matchVideo(url) ?? matchDocument(url);
