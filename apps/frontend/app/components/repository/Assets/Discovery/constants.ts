import { ContentFilter, ContentType } from '@tailor-cms/interfaces/discovery';

export const TYPE_COLOR: Record<ContentType, string> = {
  [ContentType.Article]: 'cyan',
  [ContentType.Pdf]: 'blue',
  [ContentType.Image]: 'red',
  [ContentType.Video]: 'red',
  [ContentType.Research]: 'purple',
  [ContentType.Other]: 'primary',
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
  [ContentType.Article]: 'mdi-newspaper',
  [ContentType.Pdf]: 'mdi-file-document-outline',
  [ContentType.Image]: 'mdi-image-outline',
  [ContentType.Video]: 'mdi-play-circle-outline',
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
