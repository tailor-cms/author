import { ContentType } from '@tailor-cms/interfaces/discovery';

export const TYPE_ICON: Record<ContentType, string> = {
  [ContentType.Article]: 'mdi-newspaper',
  [ContentType.Pdf]: 'mdi-file-document-outline',
  [ContentType.Image]: 'mdi-image-outline',
  [ContentType.Research]: 'mdi-school',
  [ContentType.Other]: 'mdi-link',
};

export const TYPE_COLOR: Record<ContentType, string> = {
  [ContentType.Article]: 'cyan',
  [ContentType.Pdf]: 'blue',
  [ContentType.Image]: 'red',
  [ContentType.Research]: 'purple',
  [ContentType.Other]: 'primary',
};
