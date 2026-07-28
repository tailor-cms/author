import type { ContentElement } from '@tailor-cms/interfaces/content-element';

type MigrationFn = (element: ContentElement) => ContentElement;
type TransformFn = (element: ContentElement) => Partial<ContentElement>;

const createMigration = (type: string, transform?: TransformFn): MigrationFn => {
  return (element) => ({ ...element, ...transform?.(element), type });
};

export const MIGRATIONS: Record<string, MigrationFn> = {
  JODIT_HTML: createMigration('TIPTAP_HTML'),
  HTML: createMigration('TIPTAP_HTML'),
};

export const isDeprecated = (type: string) => type in MIGRATIONS;
