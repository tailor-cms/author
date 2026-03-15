import express from 'express';
import * as ctrl from './discovery.controller.ts';
import * as validation from './discovery.validation.ts';
import { handler } from '../types.ts';

const router = express.Router({ mergeParams: true });

router.post('/', validation.discover, handler(ctrl.discover));

export default router;
