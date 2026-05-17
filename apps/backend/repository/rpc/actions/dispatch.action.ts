import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import PluginRegistry from '#shared/content-plugins/index.js';
import type { Repository } from '../../models/repository.model.js';

const { elementRegistry } = PluginRegistry;

interface RpcContext {
  userId: number;
  repository: Repository;
}

// Bound dispatcher returned by `elementRegistry.getProcedure(...)`;
// passes the call through to the plugin's `ProcedureHandler`.
type RpcDispatcher = (
  payload: unknown,
  options: { context: RpcContext },
) => Promise<unknown>;

// POST /repositories/:repositoryId/rpc/:type/:procedure
// Dispatches to a content-element plugin's server procedure; 404 when
// no such procedure is registered for the element type.
const Params = z.object({
  // Content-element type id, e.g. `CE_ASSESSMENT`.
  type: z.string().trim().min(1).max(64),
  // Procedure name from the plugin's `procedures` map.
  procedure: z.string().trim().min(1).max(64),
});
export type DispatchParams = z.infer<typeof Params>;

// Opaque per-procedure payload.
const Body = z.unknown();

async function handler({
  body,
  params,
  user,
  req,
}: Ctx<{ body: typeof Body; params: typeof Params }>) {
  const dispatcher = elementRegistry.getProcedure(
    params.type,
    params.procedure,
  ) as RpcDispatcher | undefined;
  if (!dispatcher) {
    return createError(
      StatusCodes.NOT_FOUND,
      `Procedure "${params.procedure}" not found for element type "${params.type}"`,
    );
  }
  return dispatcher(body, {
    context: { userId: user.id, repository: req.repository! },
  });
}

export default defineAction({
  body: Body,
  params: Params,
  openapi: {
    summary: 'Dispatch a content-element plugin procedure',
    description:
      'Calls a named server procedure on the plugin for ' +
      '`type`. Payload is opaque - each procedure defines its own shape.',
    authenticated: true,
  },
  handler,
});
