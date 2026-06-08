// Wire shape for the OIDC entry endpoint.
// this schema exists for documentation only; the runtime parsing of these
// query params lives in the route handlers in `oidc/index.ts`.
import { z } from 'zod';

// GET /oidc - initiate auth (or logout when `action=logout`).
export const AuthQuery = z
  .object({
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
  })
  .describe('Query for the OIDC entry endpoint.');

export type AuthQuery = z.infer<typeof AuthQuery>;
