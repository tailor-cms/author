// Rate limiting for the public webhook.
import type { Request } from 'express';
import { requestLimiter } from '#shared/request/mw.js';
import { hashToken } from './integration.service.ts';

const tokenHash = (req: Request) => hashToken(String(req.params.token ?? ''));

export const webhookRequestLimiter = requestLimiter({
  limit: 60,
  keyGenerator: tokenHash,
  event: 'integration:webhook-throttled',
  details: (req: Request) => ({ tokenHash: tokenHash(req) }),
});

// Double the per-token budget: one address can carry several producers.
export const webhookSourceLimiter = requestLimiter({
  limit: 120,
  event: 'integration:webhook-source-throttled',
});
