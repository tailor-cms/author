import kebabCase from 'lodash/kebabCase';

export * from './calculatePosition';
export * as activity from './activity';
export { default as InsertLocation } from './InsertLocations';
export * as Events from './events';
export { default as numberToLetter } from './numberToLetter';
export { default as PublishDiffChangeTypes } from './publishDiffChangeTypes';
export { default as uuid } from './uuid';

export const getMetaName = (type: string) => `meta-${kebabCase(type)}`;

export const getContainerName = (type: string) => `tcc-${kebabCase(type)}`;

export const getComponentName = (type: string) =>
  `tce-${kebabCase(resolveElementType(type))}`;

export const processAnswerType = (type: string) => `answer-${kebabCase(type)}`;

export const isQuestion = (type: string) =>
  ['QUESTION', 'REFLECTION', 'ASSESSMENT'].includes(type);

export const resolveElementType = (type: string) =>
  isQuestion(type) ? 'QUESTION-CONTAINER' : type;

export const getToolbarName = (type: string) =>
  `tce-${kebabCase(type)}-toolbar`;

export const getSidebarName = (type: string) =>
  `tce-${kebabCase(type)}-sidebar`;

export const getElementId = (element: any) =>
  element && (element.uid || element.id);
