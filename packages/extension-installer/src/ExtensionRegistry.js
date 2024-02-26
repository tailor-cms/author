import _ from 'lodash';
import fs from 'node:fs';
import jsonfile from 'jsonfile';
import path from 'node:path';
import shell from 'shelljs';

import { getInstallationInfo, selectExtension } from './prompts';

export class ExtensionRegistry {
  extensionType = '';
  elements = [];
  location = './';
  hasServerPackages = false;

  constructor(location, extensionType, hasServerPackages = false) {
    this.location = location;
    this.extensionType = extensionType;
    this.hasServerPackages = hasServerPackages;
    this.elements = this.load();
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
    return path.join(this.location, 'index.js');
  }

  get serverExportsLocation() {
    return path.join(this.location, 'server.js');
  }

  load() {
    try {
      this.elements = jsonfile.readFileSync(this.location);
    } catch (e) {
      shell.echo(`Error loading the ${this.extensionType} registry:`, e);
    }
  }

  list() {
    return this.elements.map(({ name }) => name);
  }

  printList() {
    const formattedList = this.list()
      .map((name) => `· ${name}`)
      .join('\n');
    shell.echo(formattedList);
  }

  find(packageName) {
    return this.elements.find(({ name }) => name === packageName);
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
    this.elements.push({ name: packageName, clientPackage, serverPackage });
    this.onRegistryUpdate();
  }

  async remove() {
    const packageName = await selectExtension(this.list, this.extensionType);
    const { clientPackage, serverPackage } = this.find(packageName);
    await shell.exec(`pnpm remove ${clientPackage}`);
    if (serverPackage) await shell.exec(`pnpm remove ${serverPackage}`);
    this.elements = this.elements.filter(({ name }) => name !== packageName);
    this.onRegistryUpdate();
  }

  onRegistryUpdate() {
    shell.echo('Updating the registry file...');
    jsonfile.writeFileSync(this.location, this.elements);
    shell.echo('Generating export modules...');
    const {
      clientExportsLocation,
      clientPackages,
      hasServerPackages,
      serverExportsLocation,
      serverPackages,
    } = this;
    fs.writeFileSync(clientExportsLocation, getExportModule(clientPackages));
    if (hasServerPackages) {
      fs.writeFileSync(serverExportsLocation, getExportModule(serverPackages));
    }
  }
}

// prettier-ignore
const exportModuleTemplate = _.template(
`<% _.forEach(entries, function(it, index) { %>import pkg<%- index %> from '<%- it %>';<%}); %>
// prettier-ignore
export const elements = [
  <% entries.forEach(function(it, index) { %>pkg<%- index %>,
  <%});%>
`);

const getExportModule = (entries) =>
  exportModuleTemplate({ entries }).trim().concat('\n];\n');
