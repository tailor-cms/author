import * as schemas from '../rpc.schema.ts';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
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
async function handler({
  body,
  params,
  user,
  req,
}: Ctx<{
  body: typeof schemas.DispatchBody;
  params: typeof schemas.DispatchParams;
}>) {
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
  name: 'callRpc',
  body: schemas.DispatchBody,
  params: schemas.DispatchParams,
  openapi: {
    authenticated: true,
    summary: 'Dispatch a content-element plugin procedure',
    description: oneLine`
      Calls a named server procedure on the plugin for \`type\`.
      Payload is opaque; each procedure defines its own shape.
    `,
  },
  handler,
});
