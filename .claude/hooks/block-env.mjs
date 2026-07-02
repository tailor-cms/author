#!/usr/bin/env node
/**
 * PreToolUse hook - wired on `Read|Edit|Write|MultiEdit|Bash` in
 * ../settings.json. Refuses to touch real .env files (they hold secrets),
 * whether via the file tools OR via a Bash command that names a .env path
 * (cat, grep, less, source, ...). The committed .env.example template is
 * always allowed; every other `.env` / `.env.<name>` is denied. Emits a
 * `deny` decision through hookSpecificOutput.
 *
 * Complements the settings.json permission deny-list: that list blocks
 * Read/Edit of the common .env* names, this hook also covers Bash access
 * and any .env.<name> variant the deny-list does not enumerate.
 */
import { readFileSync } from 'node:fs';

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

const isSecretEnvName = (name) =>
  /^\.env(\.[A-Za-z0-9_-]+)?$/.test(name) && name !== '.env.example';

const { tool_name: tool, tool_input: input = {} } = readStdin();

let blocked = false;
if (tool === 'Bash') {
  const cmd = input.command || '';
  const refs = cmd.match(/\.env(?:\.[A-Za-z0-9_-]+)?(?![A-Za-z0-9_-])/g) || [];
  blocked = refs.some((ref) => ref !== '.env.example');
} else {
  const file = input.file_path || input.path || '';
  blocked = isSecretEnvName(file.split('/').pop() || '');
}

if (blocked) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          '.env files hold secrets and must not be read or edited ' +
          '(Bash included). See .env.example for the documented fields.',
      },
    }),
  );
}

process.exit(0);
