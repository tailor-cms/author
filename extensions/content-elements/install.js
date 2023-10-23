// TODO: Add to the schema after installation
import inquirer from 'inquirer';
import jsonfile from 'jsonfile';
import shell from 'shelljs';

// Prompt for element name and package names
const { name, clientPackage, serverPackage } = await inquirer.prompt([
  {
    type: 'input',
    name: 'name',
    message: 'Enter element name (kebab-case):',
  },
  {
    type: 'input',
    name: 'clientPackage',
    message:
      'Provide the name of the package that contains the edit component:',
  },
  {
    type: 'input',
    name: 'serverPackage',
    message:
      'Provide the name of the package that contains the server component:',
  },
]);
// Install packages
await shell.exec(`pnpm add ${clientPackage}`);
if (serverPackage) shell.exec(`pnpm add ${serverPackage}`);
// Generate integration files
await shell.exec(
  `npx hygen edit-package new ${name} --packageName ${clientPackage}`
);
await shell.exec(
  `npx hygen server-package new ${name} --packageName ${serverPackage}`
);
// Add to the content element registry
const elements = await jsonfile.readFile('./registry.json');
elements.push({ name, clientPackage, serverPackage });
await jsonfile.writeFile('./registry.json', elements);
