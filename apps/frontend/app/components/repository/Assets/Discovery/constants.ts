import { ContentFilter, ContentType } from '@tailor-cms/interfaces/discovery';

export const TYPE_COLOR: Record<ContentType, string> = {
  [ContentType.Article]: 'asset-article',
  [ContentType.Pdf]: 'asset-document',
  [ContentType.Image]: 'asset-image',
  [ContentType.Video]: 'asset-video',
  [ContentType.Research]: 'asset-research',
  [ContentType.Other]: 'asset-other',
};

export const TYPE_LABEL: Record<ContentFilter, string> = {
  [ContentFilter.All]: 'All types',
  [ContentType.Image]: 'Images',
  [ContentType.Video]: 'Videos',
  [ContentType.Pdf]: 'PDFs',
  [ContentType.Article]: 'Articles',
  [ContentType.Research]: 'Research',
  [ContentType.Other]: 'Other',
};

export const TYPE_ICON: Record<ContentFilter, string> = {
  [ContentFilter.All]: 'mdi-view-grid',
  [ContentType.Article]: 'mdi-newspaper-variant',
  [ContentType.Pdf]: 'mdi-file-pdf-box',
  [ContentType.Image]: 'mdi-image',
  [ContentType.Video]: 'mdi-play-circle',
  [ContentType.Research]: 'mdi-school',
  [ContentType.Other]: 'mdi-link',
};

export const CONTENT_FILTERS = [
  ContentFilter.All,
  ContentType.Image,
  ContentType.Video,
  ContentType.Pdf,
  ContentType.Article,
  ContentType.Research,
].map((value) => ({
  value,
  label: TYPE_LABEL[value],
  icon: TYPE_ICON[value],
}));
