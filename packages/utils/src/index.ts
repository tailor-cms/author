import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import { filter, kebabCase, map } from 'lodash-es';
import { htmlToText } from './html';

export * from './access';
export * from './calculatePosition';
export * as activity from './activity';
export * from './changeCase';
export * from './html';
export * as Events from './events';
export { default as InsertLocation } from './insertLocation';
export { default as numberToLetter } from './numberToLetter';
export { default as uuid } from './uuid';

const TEXT_CONTAINERS = ['HTML', 'JODIT_HTML', 'TIPTAP_HTML'];
const blankRegex = /(@blank)/g;

export const getMetaName = (type: string) => `meta-${kebabCase(type)}`;

export const getContainerName = (type: string) => `tcc-${kebabCase(type)}`;

export const getComponentName = (type: string) => `tce-${kebabCase(type)}`;

export const getToolbarName = (type: string) =>
  `tce-${kebabCase(type)}-toolbar`;

export const getSidebarName = (type: string) =>
  `tce-${kebabCase(type)}-sidebar`;

export const getElementId = (element?: ContentElement | null) =>
  element && (element.uid || element.id);

export const getQuestionPromptPreview = (elements: ContentElement[]) => {
  const textAssets = filter(elements, (it) => TEXT_CONTAINERS.includes(it.type));
  const questionText = map(textAssets, 'data.content').join(' ');
  return htmlToText(questionText).replace(blankRegex, () => '____');
};
