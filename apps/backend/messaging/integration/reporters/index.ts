// Built-in reporters a thread can subscribe to.
// Each is an ordinary integration: same event bus, same posting path,
// same Slack-compatible attachments a third party would send.
import type { AnyReporter } from './lib/types.ts';
import { listen } from './reporters.service.ts';
import assets from './assets.ts';
import publishing from './publishing.ts';
import structure from './structure.ts';
import workflow from './workflow.ts';

export const REPORTERS: AnyReporter[] = [
  publishing,
  structure,
  workflow,
  assets,
];

export const initialize = () => listen(REPORTERS);
