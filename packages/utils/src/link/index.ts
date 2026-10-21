import { getDocumentEmbed } from './document';
import type { LinkEmbed } from './types';
import { getVideoEmbed } from './video';

export {
  extractYtVideoId,
  isYouTubeUrl,
  toVideoEmbedUrl,
  VIDEO_HOSTS,
} from './video';
export { detectLinkProvider, type DetectedLink } from './detect';
export type { LinkEmbed } from './types';

export const getLinkEmbed = (url: string): LinkEmbed | null =>
  getVideoEmbed(url) ?? getDocumentEmbed(url);

export const getLinkThumbnailUrl = (
  link?: { url?: string; thumbnail?: string | null } | null,
): string | null => {
  const own = link?.url ? getLinkEmbed(link.url)?.thumbnailUrl : '';
  return own || link?.thumbnail || null;
};
