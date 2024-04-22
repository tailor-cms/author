import {
  getToolbarName,
  getSidebarName,
  isQuestion,
  processAnswerType,
} from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import kebabCase from 'lodash/kebabCase';
import noop from 'lodash/noop';
import pick from 'lodash/pick';
import sortBy from 'lodash/sortBy';

/**
 * Used to resolve component name that should be used for rendering.
 * If a templateId exists then use it. If not it tries to find which type to
 * use.
 */
function getIdentifier({ templateId, type, subtype }) {
  if (templateId) return templateId;
  return isQuestion(type) ? processAnswerType(subtype) : type;
}

export default class ComponentRegistry {
  constructor(
    app,
    { name, elements, attrs, getName, getCondition, validator },
  ) {
    this.app = app;
    this._registry = [];
    this._name = name;
    this._type = kebabCase(name);
    this._attrs = attrs;
    this._getName = getName;
    this._getCondition = getCondition;
    this._validator = validator || noop;
    elements.forEach((element) => this.load(element));
  }

  load(element) {
    const { app, _attrs: attrs, _registry: registry } = this;
    const position = registry.length;
    // this._validator(element);
    const id = getIdentifier(element);
    const componentName = this._getName(id);
    registry.push({ ...pick(element, attrs), componentName, position });
    app.component(componentName, element.Edit);
    if (element.TopToolbar) {
      app.component(getToolbarName(id), element.TopToolbar);
    }
    if (element.SideToolbar) {
      app.component(getSidebarName(id), element.SideToolbar);
    }
  }

  get all() {
    return sortBy(cloneDeep(this._registry), 'position');
  }

  get(type) {
    if (!type) return null;
    const res = find(this._registry, this._getCondition(type));
    return res && cloneDeep(res);
  }
}
