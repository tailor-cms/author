import * as acorn from 'acorn';
import _ from 'lodash';
import camelCase from 'lodash/camelCase.js';
import fs from 'node:fs';
import jsonfile from 'jsonfile';
import path from 'node:path';
import shell from 'shelljs';
import upperFirst from 'lodash/upperFirst.js';

import { getInstallationInfo, selectExtension } from './prompts.js';

export class ExtensionRegistry {
  extensionType = '';
  elements = [];
  location = './';
  hasServerPackages = false;

  constructor(location, extensionType, hasServerPackages = false) {
    this.location = location;
    this.extensionType = extensionType;
    this.hasServerPackages = hasServerPackages;
    this.load();
  }

  get clientPackages() {
    return this.elements
      .map(({ clientPackage }) => clientPackage)
      .filter(Boolean);
  }

  get serverPackages() {
    if (!this.hasServerPackages) return [];
    return this.elements
      .map(({ serverPackage }) => serverPackage)
      .filter(Boolean);
  }

  get registryLocation() {
    return path.join(this.location, 'registry.json');
  }

  get clientExportsLocation() {
    return path.join(this.location, 'client.js');
  }

  get interfaceExportsLocation() {
    return path.join(this.location, 'index.d.ts');
  }

  get serverExportsLocation() {
    return path.join(this.location, 'server.js');
  }

  load() {
    try {
      shell.echo(`📦 Loading the registry from: ${this.registryLocation}\n`);
      this.elements = jsonfile.readFileSync(this.registryLocation);
      shell.echo(
        `✅ Loaded ${this.elements.length} ${this.extensionType} extensions.\n`,
      );
    } catch (e) {
      shell.echo(`❌ Error loading the ${this.extensionType} registry:`, e);
    }
  }

  list() {
    return this.elements.map(({ name }) => name);
  }

  printList(verbose = false) {
    shell.echo(`📦 Installed ${this.extensionType} extensions:\n`);
    const list = verbose
      ? this.elements
      : this.list()
          .map((name) => `· ${name}`)
          .join('\n');
    shell.echo(list);
  }

  find(packageName) {
    return this.elements.find(({ name }) => name === packageName);
  }

  areDependenciesInstalled({ clientPackage: fePkg, serverPackage: bePkg }) {
    const { elements } = this;
    const clientPkgExists =
      fePkg && elements.find((it) => it.clientPackage === fePkg);
    const serverPkgExists =
      bePkg && elements.find((it) => it.serverPackage === bePkg);
    return clientPkgExists || serverPkgExists;
  }

  async add() {
    const {
      name: packageName,
      clientPackage,
      serverPackage,
    } = await getInstallationInfo(this.hasServerPackages);
    if (this.find(packageName)) {
      shell.echo(`${this.extensionType} already exists!`);
      shell.echo(`Reinstalling the ${packageName}...`);
      await this.remove(packageName);
    }
    // If subpackages are installed, but the extension name is different
    if (this.areDependenciesInstalled({ clientPackage, serverPackage })) {
      shell.echo(
        `❌ The package(s) you are trying to add already exist! Please remove them first.`,
      );
      return;
    }
    this.elements.push({ name: packageName, clientPackage, serverPackage });
    await shell.exec(`pnpm add ${clientPackage}`);
    if (serverPackage) await shell.exec(`pnpm add ${serverPackage}`);
    this.onRegistryUpdate();
  }

  async remove(packageName) {
    packageName =
      packageName || (await selectExtension(this.list(), this.extensionType));
    const { clientPackage, serverPackage } = this.find(packageName);
    try {
      await shell.exec(`pnpm remove ${clientPackage}`);
    } catch (e) {
      shell.echo(`❌ Error removing the client package:`, e);
    }
    try {
      if (serverPackage) await shell.exec(`pnpm remove ${serverPackage}`);
    } catch (e) {
      shell.echo(`❌ Error removing the server package:`, e);
    }
    this.elements = this.elements.filter(({ name }) => name !== packageName);
    this.onRegistryUpdate();
  }

  async onRegistryUpdate() {
    const {
      clientExportsLocation,
      clientPackages,
      elements,
      hasServerPackages,
      interfaceExportsLocation,
      registryLocation,
      serverExportsLocation,
      serverPackages,
    } = this;
    shell.echo('Updating the registry file...');
    jsonfile.writeFileSync(registryLocation, elements, {
      spaces: 2,
      EOL: '\r\n',
    });
    shell.echo('Generating export modules...');
    fs.writeFileSync(clientExportsLocation, getExportModule(clientPackages));
    const interfaceModuleExport = await getInterfaceModule(
      this.location,
      elements,
      this.extensionType,
    );
    fs.writeFileSync(interfaceExportsLocation, interfaceModuleExport);
    if (hasServerPackages) {
      fs.writeFileSync(serverExportsLocation, getExportModule(serverPackages));
    }
  }
}

// prettier-ignore
const exportModuleTemplate = _.template(
`<% _.forEach(entries, function(it, index) { %>import pkg<%- index %> from '<%- it %>';
<%});%>
// prettier-ignore
export const elements = [
  <% entries.forEach(function(it, index) { %>pkg<%- index %>,
  <%});%>
`);

// prettier-ignore
const exportInterfaceTemplate = _.template(
  `
  export enum <%- enumName %> {
  <% _.forEach(types, function(val, key) {%><%- key %> = '<%- val %>',
  <%});%>
  `);

const getExportModule = (entries) =>
  exportModuleTemplate({ entries }).trim().concat('\n];\n');

const getInterfaceModule = async (dir, packages, extensionType) => {
  const isBundled = extensionType === 'content element';
  const targetPath = isBundled ? 'dist/index.cjs' : 'src/index.js';
  const packageTypes = packages.map((it) =>
    parseType(`${dir}/node_modules/${it.clientPackage}/${targetPath}`),
  );
  const toPascalCase = (str) => upperFirst(camelCase(str));
  const processType = (str) => str && toPascalCase(str.replace(/^CE_/, ''));
  const types = packageTypes.reduce((acc, type) => {
    acc[processType(type)] = type;
    return acc;
  }, {});
  const enumName = `${toPascalCase(extensionType)}Type`;
  return exportInterfaceTemplate({ enumName, types }).trim().concat('\n}\n');
};

const parseType = (path) => {
  const file = fs.readFileSync(path, { encoding: 'utf-8' });
  const opts = path.endsWith('.cjs') ? {} : { sourceType: 'module' };
  const ast = acorn.parse(file, opts);
  return (
    findTypeExportValue(ast) ||
    findTypeExportValue(ast, 'templateId') ||
    findTypeVariableValue(ast)
  );
};

const findTypeVariableValue = (ast) => {
  const targetNodeType = 'VariableDeclaration';
  const n = ast.body.filter((it) => it.type === targetNodeType);
  const filter = (val) => val.declarations.find((y) => y.id.name === 'type');
  const target = n.find(filter);
  if (!target) return '';
  const declaration = filter(target);
  return declaration?.init?.value || '';
};

const findTypeExportValue = (ast, key = 'type') => {
  const exportNodeType = 'ExportDefaultDeclaration';
  const exportNode = ast.body.find((it) => it.type === exportNodeType);
  if (!exportNode) return '';
  const { properties } = exportNode.declaration;
  const typeNode = properties.find((it) => it.key.name === key);
  return typeNode?.value?.value || '';
};
