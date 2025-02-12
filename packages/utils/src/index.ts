import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import kebabCase from 'lodash/kebabCase';

export * from './calculatePosition';
export * as activity from './activity';
export { default as InsertLocation } from './insertLocation';
export * as Events from './events';
export { default as numberToLetter } from './numberToLetter';
export { default as PublishDiffChangeTypes } from './publishDiffChangeTypes';
export { default as uuid } from './uuid';

export const getMetaName = (type: string) => `meta-${kebabCase(type)}`;

export const getContainerName = (type: string) => `tcc-${kebabCase(type)}`;

export const getComponentName = (type: string) => `tce-${kebabCase(type)}`;

export const getToolbarName = (type: string) =>
  `tce-${kebabCase(type)}-toolbar`;

export const getSidebarName = (type: string) =>
  `tce-${kebabCase(type)}-sidebar`;

export const getElementId = (element: ContentElement) =>
  element && (element.uid || element.id);
