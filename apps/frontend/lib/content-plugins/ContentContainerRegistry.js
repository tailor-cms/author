import { elements } from '@tailor-cms/content-container-collection';
import { getContainerName as getName } from '@tailor-cms/utils';
import { schema } from 'tailor-config-shared';

import ComponentRegistry from './ComponentRegistry';

const { getContainerTemplateId: getId } = schema;

export default (appInstance) =>
  new ComponentRegistry(appInstance, {
    name: 'content container',
    attrs: ['type', 'templateId', 'version'],
    getCondition: (id) => (it) => getId(it) === id,
    getName,
    elements,
  });
