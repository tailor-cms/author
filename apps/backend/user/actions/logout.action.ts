import { audit } from '#shared/audit.ts';
import { defineAction } from '#shared/request/action.ts';

// The cookie-clearing work is done by `authService.logout({ middleware:
// true })` registered as `before:` middleware in `user/index.ts` (same
// proxy pattern login uses with `authService.authenticate('local', ...)`).
// This action registers the route in the OpenAPI doc and audits the
// sign-out.
export default defineAction({
  name: 'logout',
  openapi: {
    authenticated: true,
    summary: 'Sign out',
    responses: { 204: { description: 'Cookies cleared' } },
  },
  handler({ user }) {
    audit('auth:logout', 'success', { userId: user.id });
  },
});
