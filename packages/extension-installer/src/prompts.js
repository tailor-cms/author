import inquirer from 'inquirer';

export const getInstallationInfo = (hasServerPackage = false) => {
  const inputs = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter extension name (kebab-case):',
    },
    {
      type: 'input',
      name: 'clientPackage',
      message: 'Provide the name of the authoring package:',
    },
  ];
  if (hasServerPackage) {
    inputs.push({
      type: 'input',
      name: 'serverPackage',
      message: 'Provide the name of the server package:',
    });
  }
  return inquirer.prompt(inputs);
};

export const selectExtension = async (
  extensions,
  extensionType,
  multiple = false,
) => {
  const { extension } = await inquirer.prompt([
    {
      type: multiple ? 'checkbox' : 'list',
      name: 'extension',
      message: `Select a ${extensionType}:`,
      choices: extensions,
    },
  ]);
  return extension;
};
