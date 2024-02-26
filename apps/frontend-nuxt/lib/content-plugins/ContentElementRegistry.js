import { elements } from '@tailor-cms/content-element-collection';
import { getComponentName as getName } from '@tailor-cms/utils';

import ComponentRegistry from './ComponentRegistry';

const getCondition = (type) => (it) => it.subtype === type || it.type === type;

export default (appInstance) =>
  new ComponentRegistry(appInstance, {
    name: 'content element',
    attrs: ['name', 'type', 'subtype', 'version', 'schema', 'initState', 'ui'],
    getCondition,
    getName,
    elements,
  });
