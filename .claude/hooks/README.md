# Claude Code hooks

Project hooks wired in [`../settings.json`](../settings.json). They run
automatically for anyone using Claude Code in this repo - no per-user setup.
Each receives the tool call as JSON on stdin.

## `block-env.mjs` - PreToolUse

Blocks reading or editing real `.env` files (they hold secrets), via the
file tools **and** via Bash commands that name a `.env` path (`cat`, `grep`,
`source`, ...). `.env.example` is always allowed. Returns a `deny`.

- Matcher: `Read|Edit|Write|MultiEdit|Bash`
- Backs up the `.env*` entries in the settings.json permission deny-list,
  and additionally covers Bash + any `.env.<name>` variant.

## `format-edited-file.mjs` - PostToolUse

Runs `eslint --fix` on the file just edited, so changes land lint-clean and
match house style. Best-effort - never blocks; only source files
(`ts/tsx/js/jsx/mjs/cjs/vue`), skipping `node_modules` and `dist`.

- Matcher: `Edit|Write|MultiEdit`

## Test / debug

```sh
# Should print a deny decision:
echo '{"tool_name":"Bash","tool_input":{"command":"cat .env"}}' \
  | node .claude/hooks/block-env.mjs

# Lints in place - point it at a throwaway file, not a real source file:
echo '{"tool_input":{"file_path":"/tmp/scratch.ts"}}' \
  | node .claude/hooks/format-edited-file.mjs
```

Run `claude --debug` to see which hooks fire live.

## Disable

Remove the relevant block from `settings.json` (shared) or override it in
your git-ignored `settings.local.json`.
