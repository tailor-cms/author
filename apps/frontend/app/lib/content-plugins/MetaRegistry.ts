import type { App } from 'vue';
import { getMetaName as getName } from '@tailor-cms/utils';
import { elements } from '@tailor-cms/meta-element-collection/client';
import ComponentRegistry from './ComponentRegistry';

export default (appInstance: App<Element>) =>
  new ComponentRegistry(appInstance, {
    name: 'meta input',
    attrs: ['type', 'version'],
    getCondition: (type) => (it) => it.type === type,
    getName,
    elements,
  });
