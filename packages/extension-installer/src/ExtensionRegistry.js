import _ from 'lodash';
import fs from 'node:fs';
import jsonfile from 'jsonfile';
import path from 'node:path';
import shell from 'shelljs';

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
    const clientPkgExists = elements.find((it) => it.clientPackage === fePkg);
    const serverPkgExists = elements.find((it) => it.serverPackage === bePkg);
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

  onRegistryUpdate() {
    const {
      clientExportsLocation,
      clientPackages,
      elements,
      hasServerPackages,
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

const getExportModule = (entries) =>
  exportModuleTemplate({ entries }).trim().concat('\n];\n');
