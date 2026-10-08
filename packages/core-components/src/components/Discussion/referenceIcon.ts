import { ReferenceType } from '@tailor-cms/interfaces/comment';

export const REFERENCE_ICONS: Record<string, string> = {
  [ReferenceType.Activity]: 'mdi-file-tree',
  [ReferenceType.Element]: 'mdi-toy-brick-outline',
  [ReferenceType.Asset]: 'mdi-image-multiple',
  [ReferenceType.Comment]: 'mdi-comment-outline',
};

export const referenceIcon = (entityType?: string) =>
  (entityType && REFERENCE_ICONS[entityType]) || 'mdi-link-variant';
