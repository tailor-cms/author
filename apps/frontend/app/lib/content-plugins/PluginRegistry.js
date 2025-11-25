import camelCase from 'lodash/camelCase';
import cloneDeep from 'lodash/cloneDeep';
import { elements } from '@tailor-cms/plugin-collection/client';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';
import upperFirst from 'lodash/upperFirst';

const prefixComponent = (pluginName, componentName) => {
  const toPascalCase = (str) => upperFirst(camelCase(str));
  return `Tp${(toPascalCase(pluginName), componentName)}`;
};

export default class PluginRegistry {
  constructor(app) {
    this.app = app;
    this._registry = [];
    elements.forEach((element) => this.load(element));
  }

  load(element) {
    const { app, _registry: registry } = this;
    const id = element.type;
    const position = registry.length;
    const hasPrependComponent = !!element.PrependComponent;
    const hasAppendComponent = !!element.AppendComponent;
    const hasConfigPanel = !!element.ConfigPanel;
    const prependComponentName = hasPrependComponent
      ? prefixComponent(id, 'Prepend')
      : '';
    const appendComponentName = hasAppendComponent
      ? prefixComponent(id, 'Append')
      : '';
    const configPanelName = hasConfigPanel
      ? prefixComponent(id, 'ConfigPanel')
      : '';
    registry.push({
      id,
      position,
      prependComponent: element.PrependComponent,
      appendComponent: element.AppendComponent,
      configPanel: element.ConfigPanel,
      prependComponentName,
      appendComponentName,
      configPanelName,
    });
    if (hasPrependComponent) {
      app.component(prependComponentName, element.PrependComponent);
    }
    if (hasAppendComponent) {
      app.component(appendComponentName, element.AppendComponent);
    }
    if (hasConfigPanel) {
      app.component(configPanelName, element.ConfigPanel);
    }
  }

  get all() {
    return sortBy(cloneDeep(this._registry), 'position');
  }

  get(id) {
    if (!id) return null;
    const res = find(this._registry, { id });
    return res;
  }

  getAppendComponents() {
    return this._registry.filter((it) => it.appendComponent);
  }
}
