import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

export default (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  },
];
