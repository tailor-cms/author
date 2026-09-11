// Every domain error the messaging services throw
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';

export class ParentNotFoundError extends Error {
  constructor(message = 'Message being replied to was not found') {
    super(message);
    this.name = 'ParentNotFoundError';
  }
}

export class InvalidResolveSelectorError extends Error {
  constructor(message = 'id or contentElementId required') {
    super(message);
    this.name = 'InvalidResolveSelectorError';
  }
}

export class UnanchoredMessageError extends Error {
  constructor(
    message = 'A message goes on an activity or an element, or into a thread',
  ) {
    super(message);
    this.name = 'UnanchoredMessageError';
  }
}

export class ThreadForbiddenError extends Error {
  constructor(message = 'Only the author can delete this thread') {
    super(message);
    this.name = 'ThreadForbiddenError';
  }
}

export class ThreadNotDeletableError extends Error {
  constructor(message = 'Only a free-standing thread can be deleted') {
    super(message);
    this.name = 'ThreadNotDeletableError';
  }
}

export class ThreadNotResolvableError extends Error {
  constructor(message = 'Only an anchored thread can be resolved') {
    super(message);
    this.name = 'ThreadNotResolvableError';
  }
}

export class ThreadNotSubscribableError extends Error {
  constructor(message = 'Only a free-standing thread can subscribe') {
    super(message);
    this.name = 'ThreadNotSubscribableError';
  }
}

export class UnknownTopicError extends Error {
  constructor(topics: string[]) {
    super(`Unknown subscription topic: ${topics.join(', ')}`);
    this.name = 'UnknownTopicError';
  }
}

export class IntegrationNotFoundError extends Error {
  constructor(message = 'Integration not found') {
    super(message);
    this.name = 'IntegrationNotFoundError';
  }
}

export class IntegrationKeyTakenError extends Error {
  constructor(key: string) {
    super(`Integration key "${key}" is already taken`);
    this.name = 'IntegrationKeyTakenError';
  }
}

export class NoSubscriberError extends Error {
  constructor(
    message = 'No thread in this repository subscribes to this integration',
  ) {
    super(message);
    this.name = 'NoSubscriberError';
  }
}

const STATUS = [
  [ParentNotFoundError, StatusCodes.NOT_FOUND],
  [InvalidResolveSelectorError, StatusCodes.BAD_REQUEST],
  [UnanchoredMessageError, StatusCodes.BAD_REQUEST],
  [ThreadForbiddenError, StatusCodes.FORBIDDEN],
  [ThreadNotDeletableError, StatusCodes.FORBIDDEN],
  [ThreadNotResolvableError, StatusCodes.BAD_REQUEST],
  [ThreadNotSubscribableError, StatusCodes.BAD_REQUEST],
  [UnknownTopicError, StatusCodes.BAD_REQUEST],
  [IntegrationNotFoundError, StatusCodes.NOT_FOUND],
  [IntegrationKeyTakenError, StatusCodes.CONFLICT],
  [NoSubscriberError, StatusCodes.CONFLICT],
] as const;

export function toHttpError(error: unknown) {
  const status = STATUS.find(([Type]) => error instanceof Type)?.[1];
  if (!status) throw error;
  return createError(status, (error as Error).message);
}
