// Single source of path constants for the codegen pipeline.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));

export const PACKAGE_ROOT = path.resolve(SCRIPTS_DIR, '..');
export const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
export const DIST_DIR = path.join(PACKAGE_ROOT, 'dist');

export const BACKEND_SPEC_PATH = path.join(
  REPO_ROOT,
  'apps',
  'backend',
  'openapi.json',
);

export const SPEC_PATH = path.join(DIST_DIR, 'spec.json');
export const NAMESPACE_PATH = path.join(DIST_DIR, 'api.gen.ts');
export const ALIASES_PATH = path.join(DIST_DIR, 'aliases.gen.ts');
export const GENERATED_DIR = path.join(DIST_DIR, 'generated');
export const TYPES_PATH = path.join(GENERATED_DIR, 'types.gen.ts');

/**
 * True when the calling module is the CLI entrypoint (not imported),
 * so a script can double as library + CLI.
 */
export const isScriptEntrypoint = (importMetaUrl: string): boolean => {
  const entry = process.argv[1];
  if (!entry) return false;
  // argv[1] is the entry script Node loaded; compare its file:// URL
  // to the caller's import.meta.url. Match = caller is the entrypoint.
  return importMetaUrl === `file://${path.resolve(entry)}`;
};
