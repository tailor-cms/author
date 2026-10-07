import getVideoId from 'get-video-id';
import { LinkProvider } from '@tailor-cms/interfaces/asset';
import type { LinkEmbed } from './types';

type BuildUrl = (id: string) => string;

export const VIDEO_HOSTS = {
  [LinkProvider.YouTube]: ['youtube.com', 'youtube-nocookie.com', 'youtu.be'],
  [LinkProvider.Vimeo]: ['vimeo.com'],
  [LinkProvider.Dailymotion]: ['dailymotion.com', 'dai.ly'],
  [LinkProvider.Loom]: ['loom.com'],
} satisfies Partial<Record<LinkProvider, string[]>>;

const PLAYERS: Partial<Record<LinkProvider, BuildUrl>> = {
  [LinkProvider.YouTube]: (id) => `https://www.youtube.com/embed/${id}`,
  [LinkProvider.Vimeo]: (id) => `https://player.vimeo.com/video/${id}`,
  [LinkProvider.Loom]: (id) => `https://www.loom.com/embed/${id}`,
  [LinkProvider.Dailymotion]: (id) =>
    `https://www.dailymotion.com/embed/video/${id}`,
};

const THUMBNAILS: Partial<Record<LinkProvider, BuildUrl>> = {
  [LinkProvider.YouTube]: (id) =>
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
};

export interface VideoLink {
  provider: LinkProvider;
  id: string;
}

export const findVideo = (url: string): VideoLink | null => {
  const { id, service } = getVideoId(url);
  const provider = service as LinkProvider;
  return id && PLAYERS[provider] ? { provider, id } : null;
};

export const getVideoEmbed = (url: string): LinkEmbed | null => {
  const video = findVideo(url);
  if (!video) return null;
  const { provider, id } = video;
  return {
    kind: 'video',
    embedUrl: PLAYERS[provider]!(id),
    thumbnailUrl: THUMBNAILS[provider]?.(id) ?? '',
  };
};

export const toVideoEmbedUrl = (url: string): string | null =>
  getVideoEmbed(url)?.embedUrl ?? null;

export const extractYtVideoId = (url: string): string | null => {
  const video = findVideo(url);
  return video?.provider === LinkProvider.YouTube ? video.id : null;
};

export const isYouTubeUrl = (url: string) => !!extractYtVideoId(url);
