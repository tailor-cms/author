import ComponentRegistry from './ComponentRegistry';
import elementList from 'tailor-config-shared/src/core-elements.js';
import { getComponentName as getName } from '@tailor-cms/utils';

const getCondition = type => it => it.subtype === type || it.type === type;

export default Vue => new ComponentRegistry(Vue, {
  name: 'content element',
  extensions: elementList,
  attrs: ['name', 'type', 'subtype', 'version', 'schema', 'initState', 'ui'],
  getCondition,
  getName
});
