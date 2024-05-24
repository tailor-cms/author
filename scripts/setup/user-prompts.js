import select from '@inquirer/select';

export function shouldUseComposeSpec() {
  return select({
    message: 'Select the database setup method:',
    choices: [
      {
        name: 'Use Docker to provide DB service',
        value: true,
      },
      {
        name: 'I have my own setup',
        value: false,
      },
    ],
  });
}

export function shouldSeedTheDatabase() {
  return select({
    message: 'Seed the database?',
    choices: [
      {
        name: 'Yes',
        value: true,
      },
      {
        name: 'No',
        value: false,
      },
    ],
  });
}
