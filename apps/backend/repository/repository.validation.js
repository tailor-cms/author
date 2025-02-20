import { body, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

export const addUserGroup = [
  body('userGroupId').notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  },
];
