import { elements } from '@tailor-cms/content-element-collection/client';
import { getComponentName as getName } from '@tailor-cms/utils';

import ComponentRegistry from './ComponentRegistry';

export default (appInstance) =>
  new ComponentRegistry(appInstance, {
    name: 'content element',
    attrs: [
      'name', 'type', 'version', 'schema', 'initState', 'ui', 'isQuestion',
      'isComposite',
    ],
    getCondition: (type) => (it) => it.type === type,
    getName,
    elements,
  });
