import { AGENT_MODES } from '@tailor-cms/interfaces/agent.ts';
import { Entity } from '@tailor-cms/interfaces/revision.ts';
import { REASONING_EFFORTS } from '@tailor-cms/interfaces/ai.ts';
import { body, param } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

const sessionPathParams = [param('sessionId').isUUID()];

export const list = defineRequestValidator([]);

export const get = defineRequestValidator(sessionPathParams);

export const create = defineRequestValidator([
  body('mode').isString().isIn(AGENT_MODES).optional(),
]);

export const remove = defineRequestValidator(sessionPathParams);

export const run = defineRequestValidator([
  body('sessionId').isUUID().optional(),
  body('message').isString().trim().notEmpty(),
  body('mode').isString().isIn(AGENT_MODES).optional(),
  body('reasoningEffort').isString().isIn(REASONING_EFFORTS).optional(),
  body('focus').isArray().optional(),
  body('focus.*.kind').isIn([Entity.Activity, Entity.ContentElement]).optional(),
  body('focus.*.id').isInt().optional(),
  body('focus.*.type').isString().optional(),
  body('focus.*.label').isString().optional(),
  body('focus.*.embedUid').isString().optional(),
]);
