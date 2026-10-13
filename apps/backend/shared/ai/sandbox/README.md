# /shared/ai/sandbox

A headless browser where the AI assistant runs the pages it writes, to
see what learners will see before anything is saved.

- **Checks** (`inspect.ts`, `interactions.ts`): script errors (with line
  numbers), blocked requests, layout, clicks and drags, screenshots.
- **Self-contained on save** (`bundle.ts`): CDN libraries are inlined so
  the page keeps working if a CDN goes away. ES modules stay on the CDN.

## Security

Generated code is untrusted, so it never runs with access to the app:

- **No app access.** Pages run with the same restrictions as the
  element's frame, applied as a CSP sandbox (`network.ts`): no cookies,
  storage or session.
- **No network beyond library CDNs** (`network.ts`). Everything else,
  including internal services and WebSockets, is blocked.
- **Bounded runs.** Each run gets a fresh browser context, with timeouts,
  size limits and a cap on parallel pages.
- **A separate browser in production.** For security implications.

## Production browser

**Browserless** (default choice): set `AI_SANDBOX_BROWSER_URL` to
`wss://production-sfo.browserless.io/chromium/playwright?token=...`. It is
billed per 30s of connection, so the connection closes after every run;

**Self-hosted** (optional): a container from `mcr.microsoft.com/playwright`
running `playwright run-server`, with no secrets, no cloud role, and only
the backend allowed to reach it. Keep its version equal to
`playwright-core`.
