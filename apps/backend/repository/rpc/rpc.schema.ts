// Wire-shape contracts for the RPC sub-slice.
import { z } from 'zod';

import { RepositoryScopedParams, ShortText } from '#shared/request/schemas.ts';

// POST /repositories/:repositoryId/rpc/:type/:procedure
export const DispatchParams = RepositoryScopedParams.extend({
  type: ShortText(1, 64).describe(
    'Content-element type id, e.g. `CE_ASSESSMENT`.',
  ),
  procedure: ShortText(1, 64).describe(
    `Procedure name from the plugin's \`procedures\` map.`,
  ),
}).describe('Path params for a content-element RPC dispatch.');

export type DispatchParams = z.infer<typeof DispatchParams>;

// Opaque per-procedure payload. Shape is owned by the plugin's
// `ProcedureHandler` implementation, not by this layer - kept as
// `unknown` so the RPC layer never re-validates plugin contracts.
export const DispatchBody = z
  .unknown()
  .describe('Opaque per-procedure payload; plugin owns the wire shape.');

export type DispatchBody = z.infer<typeof DispatchBody>;
