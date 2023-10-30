import * as dotenv from 'dotenv';
import * as fs from 'node:fs/promises';
import isNil from 'lodash/isNil.js';
import isString from 'lodash/isString.js';

const DEV_CONFIG_PATH = './scripts/setup/.env';

function addEnvVariable(key, value) {
  const escapeNewlines = (str) => str.replace(/\n/g, '\\n');
  // prettier-ignore
  const processedValue = isString(value)
    ? value
    : isNil(value) ? '' : value.toString();
  return `${key}=${escapeNewlines(processedValue)}`;
}

const loadConfig = async (path) => {
  try {
    return dotenv.parse(await fs.readFile(path, 'utf-8'));
  } catch {
    return {};
  }
};
export const loadDevConfig = () => loadConfig(DEV_CONFIG_PATH);

export async function saveConfig(path, config) {
  const data = Object.keys(config)
    .map((key) => addEnvVariable(key, config[key]))
    .join('\n');
  await fs.writeFile(path, data);
}

export async function saveDevConfig(config) {
  const existing = await loadDevConfig();
  return saveConfig(DEV_CONFIG_PATH, {
    ...existing,
    ...config,
  });
}

export default async function (path, additionalEnvConfig) {
  const envPath = `${path}/.env`;
  const defaultDevConfigPath = `${envPath}.dev`;
  const defaultDevConfig = await loadConfig(defaultDevConfigPath);
  let existingEnvConfig = {};
  try {
    existingEnvConfig = await loadConfig(envPath);
  } catch (err) {
    console.log(`◦ No existing .env in ${path}`);
  }
  const config = {
    ...existingEnvConfig,
    ...defaultDevConfig,
    ...additionalEnvConfig,
  };
  await saveConfig(envPath, config);
  return config;
}
