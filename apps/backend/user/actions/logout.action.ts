import { defineAction } from '#shared/request/action.ts';

// The cookie-clearing work is done by `authService.logout({ middleware:
// true })` registered as `before:` middleware in `user/index.ts` (same
// proxy pattern login uses with `authService.authenticate('local', ...)`).
// This action exists so the route is registered in the OpenAPI doc;
// returning undefined lets the wrapper emit 204.
export default defineAction({
  name: 'logout',
  openapi: {
    authenticated: true,
    summary: 'Sign out',
    responses: { 204: { description: 'Cookies cleared' } },
  },
  handler() {},
});
