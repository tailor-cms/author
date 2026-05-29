import type { Check } from './types.ts';

import database from './database.ts';
import integrations from './integrations.ts';
import kv from './kv-store.ts';
import storage from './storage.ts';

export const checks: Check[] = [database, kv, storage, ...integrations];

export type { Check, CheckOutcome } from './types.ts';
