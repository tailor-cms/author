#!/usr/bin/env node
/**
 * PostToolUse hook - wired on `Edit|Write|MultiEdit` in ../settings.json.
 * Runs the repo's ESLint (with --fix) on just the file Claude edited, so
 * every change lands lint-clean and matching house style. Only source
 * files (ts/tsx/js/jsx/mjs/cjs/vue) are linted; node_modules and dist are
 * skipped. Best-effort: it never blocks - ESLint exiting non-zero on an
 * unfixable rule is fine, the auto-fixes are already written.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LINTABLE = /\.(ts|mts|cts|js|mjs|cjs|vue)$/;

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

const { tool_input: input = {}, cwd } = readStdin();
const file = input.file_path || '';
const projectDir = cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

const skip =
  !file ||
  !LINTABLE.test(file) ||
  file.includes('/node_modules/') ||
  file.includes('/dist/');

if (!skip) {
  const eslintBin = `${projectDir}/node_modules/.bin/eslint`;
  if (existsSync(eslintBin)) {
    try {
      execFileSync(eslintBin, ['--fix', '--no-warn-ignored', file], {
        cwd: projectDir,
        stdio: 'ignore',
        timeout: 55_000,
      });
    } catch {
      // Unfixable lint errors / ignored files - fixes still applied.
    }
  }
}

process.exit(0);
