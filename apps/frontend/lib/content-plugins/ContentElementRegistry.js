import { elements } from '@tailor-cms/content-element-collection/client';
import { getComponentName as getName } from '@tailor-cms/utils';

import ComponentRegistry from './ComponentRegistry';

export const questionType = new Map([
  ['NR', 'NUMERICAL_RESPONSE'],
  ['MQ', 'MATCHING_QUESTION'],
  ['DD', 'DRAG_DROP'],
  ['MC', 'MULTIPLE_CHOICE'],
  ['SC', 'SINGLE_CHOICE'],
  ['TF', 'TRUE_FALSE'],
  ['TR', 'TEXT_RESPONSE'],
  ['FB', 'FILL_BLANK'],
]);

const LEGACY_QUESTION_TYPES = ['ASSESSMENT', 'REFLECTION', 'QUESTION'];

class ContentElementRegistry extends ComponentRegistry {
  get questions() {
    return this.all.filter((it) => it.isQuestion);
  }

  isQuestion(type) {
    return this.get(type).isQuestion || this.isLegacyQuestion(type);
  };

  isLegacyQuestion(type) {
    return LEGACY_QUESTION_TYPES.includes(type);
  }

  matchesAllowedElementConfig(el, config) {
    const isGradable = this.isLegacyQuestion(el.type)
      ? el.type === 'ASSESSMENT'
      : el.data.isGradable;
    return config.isGradable === isGradable;
  };

  getByEntity(el) {
    const isLegacyQuestion = this.isLegacyQuestion(el.type);
    if (!isLegacyQuestion) return this.get(el.type);
    const type = questionType.get(el.data.type);
    return this.get(type ?? el.type);
  };
}

export default (appInstance) =>
  new ContentElementRegistry(appInstance, {
    name: 'content element',
    attrs: [
      'name', 'type', 'version', 'schema', 'initState', 'ui', 'isQuestion',
      'isComposite',
    ],
    getCondition: (type) => (it) => it.type === type,
    getName,
    elements,
  });
