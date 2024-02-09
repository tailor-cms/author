// TODO: Add to the schema after installation
import _ from 'lodash';
import fs from 'fs';
import inquirer from 'inquirer';
import jsonfile from 'jsonfile';
import shell from 'shelljs';

const { packageName } = await inquirer.prompt([
  {
    type: 'input',
    name: 'packageName',
    message: 'Name of the package that contains meta component:',
  },
]);

// Install package
await shell.exec(`pnpm add ${packageName}`);

// Add to the registry
const elements = await jsonfile.readFile('./registry.json');
if (elements.find(({ name }) => name === packageName)) {
  shell.echo('Element already added!');
} else {
  elements.push({ name: packageName });
}
await jsonfile.writeFile('./registry.json', elements);

// Generate export module
// prettier-ignore
const template = _.template(`<% _.forEach(entries, function(it, index) { %>import pkg<%- index %> from '<%- it %>';
<%}); %>
// prettier-ignore
export const elements = [
  <% entries.forEach(function(it, index) { %>pkg<%- index %>,
  <%});%>
`);
const exportModule = template({ entries: elements.map(({ name }) => name) })
  .trim()
  .concat('\n];\n');
fs.writeFileSync('./index.js', exportModule);
