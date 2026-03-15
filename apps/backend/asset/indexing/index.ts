import express from 'express';
import * as ctrl from './indexing.controller.ts';
import * as validation from './indexing.validation.ts';
import { handler } from '../types.ts';

const router = express.Router({ mergeParams: true });

router.post('/', validation.create, handler(ctrl.create));
router.delete('/', handler(ctrl.remove));
router.get('/status', handler(ctrl.status));

export default router;
