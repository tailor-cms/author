// Shared HTTP mapping for the review actions.
import {
  ReviewDisabledError,
  RubricNotEnabledError,
} from '../review.service.ts';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';

/**
 * Map the service's rubric-resolution domain errors to their HTTP
 * responses; anything else rethrows to the global error middleware.
 */
export function mapRubricError(err: unknown): Promise<never> {
  if (err instanceof ReviewDisabledError) {
    return createError(StatusCodes.FORBIDDEN, err.message);
  }
  if (err instanceof RubricNotEnabledError) {
    return createError(StatusCodes.BAD_REQUEST, err.message);
  }
  throw err;
}
