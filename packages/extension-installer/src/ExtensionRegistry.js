import fs from 'node:fs';
import path from 'node:path';
import { camelCase, template, upperFirst } from 'lodash-es';
import * as acorn from 'acorn';
import jsonfile from 'jsonfile';
import shell from 'shelljs';

import { getInstallationInfo, selectExtension } from './prompts.js';

export class ExtensionRegistry {
  extensionType = '';
  elements = [];
  location = './';
  hasServerPackage = false;
  serverExportPath = '';

  // opts.serverPackage controls server.js generation:
  //   - not set:  no server exports (e.g. plugins)
  //   - true:     each extension has a dedicated server npm package
  //               listed as `serverPackage` in registry.json (e.g. content-elements)
  //   - 'path':   server export lives within the client package at given path
  //               (e.g. 'src/manifest.js' for meta-inputs)
  constructor(location, extensionType, opts = {}) {
    this.location = location;
    this.extensionType = extensionType;
    this.hasServerPackage = !!opts?.serverPackage;
    this.serverExportPath = typeof opts?.serverPackage === 'string'
      ? opts.serverPackage
      : '';
    this.load();
  }

  get clientPackages() {
    return this.elements
      .map(({ clientPackage }) => clientPackage)
      .filter(Boolean);
  }

  // Returns import paths for the generated server.js.
  // - serverExportPath set: derives paths from client packages
  //   e.g. @tailor-cms/tme-textarea/src/manifest.js
  // - hasSeparateServerPackage: reads dedicated server package names
  //   from the registry e.g. @tailor-cms/ce-html-server
  get serverPackages() {
    if (!this.hasServerPackage) return [];
    if (this.serverExportPath) {
      return this.clientPackages.map((pkg) => `${pkg}/${this.serverExportPath}`);
    }
    return this.elements
      .map(({ serverPackage }) => serverPackage)
      .filter(Boolean);
  }

  // True when each extension has a dedicated server npm package
  // (e.g. @tailor-cms/ce-html-server) listed in the registry.
  get hasSeparateServerPackage() {
    return this.hasServerPackage && !this.serverExportPath;
  }

  get registryLocation() {
    return path.join(this.location, 'registry.json');
  }

  get clientExportsLocation() {
    return path.join(this.location, 'client.js');
  }

  get typeObjectLocation() {
    return path.join(this.location, 'types.js');
  }

  get typeEnumLocation() {
    return path.join(this.location, 'enum.ts');
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
    } = await getInstallationInfo(this.hasSeparateServerPackage);
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

  rebuild() {
    const {
      clientExportsLocation,
      clientPackages,
      typeObjectLocation,
      typeEnumLocation,
      serverExportsLocation,
      serverPackages,
    } = this;
    shell.echo('Generating export modules...');
    fs.writeFileSync(clientExportsLocation, getExportModule(clientPackages));
    const typeExport = generateTypeExport(
      this.location,
      this.elements,
      this.extensionType,
      this.serverExportPath,
    );
    fs.writeFileSync(typeObjectLocation, typeExport.js);
    fs.writeFileSync(typeEnumLocation, typeExport.ts);
    if (serverPackages.length) {
      fs.writeFileSync(serverExportsLocation, getExportModule(serverPackages));
    }
  }

  onRegistryUpdate() {
    const { elements, registryLocation } = this;
    shell.echo('Updating the registry file...');
    jsonfile.writeFileSync(registryLocation, elements, {
      spaces: 2,
      EOL: '\r\n',
    });
    this.rebuild();
  }
}

// prettier-ignore
const exportModuleTemplate = template(
// eslint-disable-next-line @stylistic/indent
`<% _.forEach(entries, function(it, index) { %>import pkg<%- index %> from '<%- it %>';
<%});%>
// prettier-ignore
export const elements = [
  <% entries.forEach(function(it, index) { %>pkg<%- index %>,
  <%});%>
`);

// prettier-ignore
const exportTypeTemplate = template(
  `
  export const <%- enumName %> = {
  <% _.forEach(types, function(val, key) {%><%- key %>: '<%- val %>',
  <%});%>
  `);

// prettier-ignore
const exportEnumTemplate = template(
  `
  export enum <%- enumName %> {
  <% _.forEach(types, function(val, key) {%><%- key %> = '<%- val %>',
  <%});%>
  `);

const getExportModule = (entries) =>
  exportModuleTemplate({ entries }).trim().concat('\n];\n');

const generateTypeExport = (dir, packages, extensionType, serverExportPath) => {
  const isBuilt = extensionType === 'content element';
  const defaultPath = isBuilt ? 'dist/index.cjs' : 'src/index.js';
  const targetPath = serverExportPath || defaultPath;
  const packageTypes = packages.map((it) =>
    parseType(`${dir}/node_modules/${it.clientPackage}/${targetPath}`),
  );
  const toPascalCase = (str) => upperFirst(camelCase(str));
  const processType = (str) => str && toPascalCase(str);
  const types = packageTypes.reduce((acc, type) => {
    acc[processType(type)] = type;
    return acc;
  }, {});
  const enumName = `${toPascalCase(extensionType)}Type`;
  return {
    js: exportTypeTemplate({ enumName, types }).trim().concat('\n};\n'),
    ts: exportEnumTemplate({ enumName, types }).trim().concat('\n};\n'),
  };
};

const parseType = (path) => {
  const file = fs.readFileSync(path, { encoding: 'utf-8' });
  const opts = path.endsWith('.cjs') ? {} : { sourceType: 'module' };
  const ast = acorn.parse(file, { ...opts, ecmaVersion: 'latest' });
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
  const properties = exportNode?.declaration?.properties;
  if (!properties) return '';
  const typeNode = properties.find((it) => it.key?.name === key);
  return typeNode?.value?.value || '';
};
