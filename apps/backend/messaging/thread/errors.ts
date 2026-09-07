import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import * as service from './thread.service.ts';

// The HTTP answer for each error the thread service throws, so an
// action's catch stays one line and a new error is added in one place.
const STATUS = [
  [service.ThreadNotFoundError, StatusCodes.NOT_FOUND],
  [service.ThreadForbiddenError, StatusCodes.FORBIDDEN],
  [service.ThreadNotDeletableError, StatusCodes.FORBIDDEN],
  [service.ThreadNotSubscribableError, StatusCodes.BAD_REQUEST],
  [service.ThreadNotResolvableError, StatusCodes.BAD_REQUEST],
  [service.UnknownTopicError, StatusCodes.BAD_REQUEST],
] as const;

/** Anything the map does not name is not ours, and bubbles to a 500. */
export function toHttpError(error: unknown) {
  const status = STATUS.find(([Type]) => error instanceof Type)?.[1];
  if (!status) throw error;
  return createError(status, (error as Error).message);
}
