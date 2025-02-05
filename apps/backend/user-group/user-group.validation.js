import { body, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@tailor-cms/common';

export const upsertUserGroup = [
  body('name').notEmpty().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  },
];

export const upsertUser = [
  body('email').notEmpty().isEmail().normalizeEmail(),
  body('role')
    .notEmpty()
    .isIn([UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR]),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  },
];
