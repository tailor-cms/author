import { size } from 'lodash-es';

type ElementData = Record<string, any>;

// TODO: get isEmpty from CEK manifest
export const isEmpty: Record<string, (data: ElementData) => boolean> = {
  TIPTAP_HTML: ({ content }: ElementData) => !content || content === '<p></p>',
  IMAGE: ({ url }: ElementData) => !url,
  VIDEO: ({ url }: ElementData) => !url,
  MULTIPLE_CHOICE: ({ question }: ElementData) => !question || !size(question),
};

export const required = (type: string, label: string) => (data: unknown) => {
  if (!isEmpty[type]) return true;
  return isEmpty[type](data as ElementData) ? `${label} is a required field` : true;
};
