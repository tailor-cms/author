import express from 'express';
import repository from './repository/index.js';
import seedRouter from './tests/api/index.js';
import tag from './tag/index.js';
import user from './user/index.js';
import userGroup from './user-group/index.js';
import { extractAuthData } from '#shared/auth/mw.js';
import authenticator from '#shared/auth/index.js';
import ai from '#shared/ai/index.js';
import {
  ai as aiConfig,
  auth as authConfig,
  test as testConfig,
} from '#config';

const { authenticate } = authenticator;
const router = express.Router();
router.use(processBody);
router.use(extractAuthData);

// Public routes:
router.get('/healthcheck', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
router.use(user.path, user.router);

// SSO routes:
authConfig.oidc.enabled &&
  (await (async () => {
    const { default: oidc } = await import('./oidc/index.js');
    router.use(oidc.path, oidc.router);
  })());

// Protected routes:
router.use(authenticate('jwt'));
router.use(repository.path, repository.router);
router.use(tag.path, tag.router);
router.use(userGroup.path, userGroup.router);
if (aiConfig.isEnabled) router.use(ai.path, ai.router);
if (testConfig.isSeedApiEnabled) router.use(seedRouter.path, seedRouter.router);

export default router;

function processBody(req, _res, next) {
  const { body } = req;
  if (body && body.email) body.email = body.email.toLowerCase();
  next();
}
