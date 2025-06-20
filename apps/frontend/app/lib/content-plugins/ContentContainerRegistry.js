import { elements } from '@tailor-cms/content-container-collection/client';
import { getContainerName as getName } from '@tailor-cms/utils';
import { schema } from '@tailor-cms/config';

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
