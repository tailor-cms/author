import { cloneDeep } from 'lodash-es';
import { elements } from '@tailor-cms/content-element-collection/client';
import { getComponentName as getName } from '@tailor-cms/utils';
import { v4 as uuid } from 'uuid';

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
const initQuestion = () => ({
  id: uuid(),
  data: { content: '' },
  type: 'TIPTAP_HTML',
  position: 1,
  embedded: true,
});

class ContentElementRegistry extends ComponentRegistry {
  get questions() {
    return this.all.filter((it) => it.isQuestion);
  }

  resetData(element) {
    const el = this.get(element.type);
    const data = cloneDeep(element.data);
    if (!el) return null;
    const initData = el.initState();
    if (this.isQuestion(element.type)) {
      const question = initQuestion();
      const isGradable = data.isGradable ?? true;
      Object.assign(initData, {
        embeds: { [question.id]: question },
        question: [question.id],
        isGradable,
      });
      if (!isGradable) delete data.correct;
    }
    return initData;
  };

  isQuestion(type) {
    return this.isLegacyQuestion(type) || this.get(type)?.isQuestion;
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
      'isComposite', 'ai',
    ],
    getCondition: (type) => (it) => it.type === type,
    getName,
    elements,
  });
