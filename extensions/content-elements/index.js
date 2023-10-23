import managedPackages from './registry.json' assert { type: 'json' };

const packages = [
  ...managedPackages.map(({ name }) => name),
];

export default packages;
