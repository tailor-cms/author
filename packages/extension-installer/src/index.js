// TODO: Add to the schema after installation
// TODO: Implement doctor cmd
// TODO: Implement update cmd
import { Command } from 'commander';
import { ExtensionRegistry } from './ExtensionRegistry.js';

export default (location, extensionType, hasServerPackages) => {
  const registry = new ExtensionRegistry(
    location,
    extensionType,
    hasServerPackages,
  );

  const program = new Command();
  program
    .name(`Tailor CMS ${extensionType} extension installer`)
    .description(
      `Provides commands to install and manage ${extensionType} extensions`,
    )
    .version('0.0.1');

  program
    .command('ls')
    .alias('list')
    .description('List all installed extensions')
    .option('-v', 'Display the sub-packages of each extension')
    .action((options) => registry.printList(options.v));

  program
    .command('add')
    .alias('i')
    .alias('install')
    .description('Install a new extension')
    .action(() => registry.add());

  program
    .command('rm')
    .alias('remove')
    .alias('uninstall')
    .description(
      'Remove an extension by selecting it from a list of installed extensions',
    )
    .action(() => registry.remove());

  return program.parse(process.argv);
};
