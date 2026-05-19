// Wire-shape contracts for the OIDC slice.
//
// OIDC is a redirect-based auth flow (passport-middleware chained
// `(req, res, next)` handlers) rather than a JSON API; the schemas
// here exist for query documentation, not for `defineAction` wrapping
// or runtime validation (passport / openid-client own the actual
// parsing of the IdP response).
import { oneLine } from 'common-tags';
import { z } from 'zod';

// GET /oidc — initiate auth (or logout when `action=logout`).
export const AuthQuery = z.object({
  action: z
    .enum(['logout'])
    .optional()
    .describe('Set to `logout` to terminate the OIDC session.'),
  resign: z
    .enum(['true', 'false'])
    .optional()
    .describe(
      'Force the IdP to re-prompt for credentials by passing `prompt=login` upstream.',
    ),
}).describe('Query for the OIDC entry endpoint.');

export type AuthQuery = z.infer<typeof AuthQuery>;

// GET /oidc/callback — IdP returns the user here.
// Our strategy is configured with `response_types: ['code']` (authorization
// code flow), so the callback receives the standard OIDC code-flow set
// plus our custom `action` marker on logout round-trips. Passport reads
// `code` / `state` / `iss` etc. via openid-client; the slice's own
// handler only inspects `action`. We declare `passthrough` because the
// IdP may forward additional vendor-specific params.
export const CallbackQuery = z.looseObject({
  // OIDC code-flow success (RFC 6749 §4.1.2 + OIDC Core 1.0).
  code: z.string().optional().describe('Authorization code returned by the IdP.'),
  state: z.string().optional().describe('CSRF token round-tripped via the IdP.'),
  iss: z.string().optional().describe(oneLine`
    Issuer identifier (OIDC discovery; required by spec-compliant IdPs).
  `),
  session_state: z
    .string()
    .optional()
    .describe('IdP session state for session monitoring.'),
  // OIDC error response (RFC 6749 §4.1.2.1).
  error: z
    .string()
    .optional()
    .describe('Error code from the IdP when authorization fails.'),
  error_description: z
    .string()
    .optional()
    .describe('Human-readable error description from the IdP.'),
  error_uri: z
    .url()
    .optional()
    .describe('URL the IdP exposes describing the error.'),
  // Custom: our logout flow round-trips through the same callback path
  // with `?action=logout` so the handler can branch on it.
  action: z
    .enum(['logout'])
    .optional()
    .describe(oneLine`
      Set by our \`postLogoutRedirectUri\` when the IdP returns after a
      logout flow.
    `),
}).describe('Query params returned by the OIDC IdP to /oidc/callback.');

export type CallbackQuery = z.infer<typeof CallbackQuery>;
