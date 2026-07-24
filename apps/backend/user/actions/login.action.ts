import { audit } from '#shared/audit.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

// POST /users/login
// Email + password login. The route mounts a four-step `before` chain:
//   1. setLoginLimitKey      derive a per-(ip, email) hash key
//   2. loginRequestLimiter   rate-limit using that key
//   3. authenticate('local') passport credential check + JWT cookie
//   4. resetLoginAttempts    wipe the limiter counter on success
// This action's body schema documents the wire shape (and gates obvious
// malformed bodies), while passport-local owns the actual credential
// check. On success the chain hands `req.user` to this handler (failures
// are audited inside the local strategy; they never reach it).
async function handler({ user, req }: Ctx<{ body: typeof schemas.LoginInput }>) {
  audit('auth:login', 'success', {
    strategy: 'local',
    userId: user.id,
    ip: req.ip,
  });
  return service.profile(user, req.authData);
}

export default defineAction({
  name: 'login',
  raw: true,
  body: schemas.LoginInput,
  openapi: {
    summary: 'Email + password login',
    responses: {
      200: {
        description: 'Authenticated profile + auth-strategy metadata.',
        schema: schemas.ProfileResult,
      },
    },
  },
  handler,
});
