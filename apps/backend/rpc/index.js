import express from 'express';
import { StatusCodes } from 'http-status-codes';

import PluginRegistry from '#shared/content-plugins/index.js';

const { elementRegistry } = PluginRegistry;
const router = express.Router();

router.post('/:type/:procedure', async ({ user, repository, body, params }, res) => {
  const { type, procedure } = params;
  const handler = elementRegistry.getProcedure(type, procedure);
  if (!handler) {
    const error = `Procedure "${procedure}" not found for element type "${type}"`;
    return res.status(StatusCodes.NOT_FOUND).json({ error });
  }
  const context = { userId: user.id, repository };
  const result = await handler(body, { context });
  return res.json({ data: result });
});

export default {
  path: '/rpc',
  router,
};
