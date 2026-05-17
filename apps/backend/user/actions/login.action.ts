import { z } from 'zod';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { Email } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// POST /users/login
// Email + password login. The route mounts a four-step `before` chain:
//   1. setLoginLimitKey      derive a per-(ip, email) hash key
//   2. loginRequestLimiter   rate-limit using that key
//   3. authenticate('local') passport credential check + JWT cookie
//   4. resetLoginAttempts    wipe the limiter counter on success
// This action's body schema documents the wire shape (and gates obvious
// malformed bodies), while passport-local owns the actual credential
// check. On success the chain hands `req.user` to this handler
const Body = z.object({
  email: Email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof Body>;

async function handler({ user, req }: Ctx<{ body: typeof Body }>) {
  return service.profile(user, req.authData);
}

export default defineAction({
  raw: true,
  body: Body,
  openapi: {
    summary: 'Email + password login',
  },
  handler,
});
