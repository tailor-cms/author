// Lets something other than a person post in a repository's threads:
// Tailor's own reporters, and outside systems via webhook. Registers
// those identities, lists and revokes them, and posts what an outside
// system sends.
//
// Threads subscribe to what they want to hear, so registering an integration
// hands out a credential, not an invitation.
import type {
  CreateIntegrationInput,
  InboundWebhookInput,
  SlackAttachment,
} from './schemas/index.ts';
import type { Integration } from './models/integration.model.js';
import * as commentService from '../comment.service.ts';
import * as threadService from '../thread/thread.service.ts';
import { Op } from 'sequelize';
import { IntegrationType } from '@tailor-cms/interfaces/comment.ts';
import { createLogger } from '#logger';
import { parseShortcode } from '@tailor-cms/utils';
import crypto from 'node:crypto';
import IntegrationModel from './models/integration.model.js';

const logger = createLogger('comment:integration');

export interface IntegrationIdentity {
  key: string;
  name: string;
  icon: string;
}

type ExternalIntegration = Integration & { repositoryId: number };

// The integrations a repository sees
const visibleTo = (repositoryId: number) => ({
  [Op.or]: [{ repositoryId }, { repositoryId: null }],
});

// The token is used for webhook auth. We store only the hash.
export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

// What an attachment says in one line.
const resolveAttachmentSummary = (attachment: SlackAttachment) =>
  attachment.fallback || attachment.title || attachment.text || '';

export class NoSubscriberError extends Error {
  constructor(
    message = 'No thread in this repository subscribes to this integration',
  ) {
    super(message);
    this.name = 'NoSubscriberError';
  }
}

export class IntegrationKeyTakenError extends Error {
  constructor(key: string) {
    super(`Integration key "${key}" is already taken`);
    this.name = 'IntegrationKeyTakenError';
  }
}

export class IntegrationNotFoundError extends Error {
  constructor(message = 'Integration not found') {
    super(message);
    this.name = 'IntegrationNotFoundError';
  }
}

/**
 * Registers a built-in integration, or hands back the one already
 * there. Built-ins post the same way an outside system does.
 */
export async function registerBuiltin(identity: IntegrationIdentity) {
  const [integration] = await IntegrationModel.findOrCreate({
    where: { key: identity.key, repositoryId: null },
    defaults: {
      ...identity,
      type: IntegrationType.Builtin,
      repositoryId: null,
    },
  });
  return integration;
}

export function list(repositoryId: number) {
  return IntegrationModel.findAll({
    where: visibleTo(repositoryId),
    order: [['id', 'ASC']],
  });
}

/**
 * Registers an external integration and returns the token it posts with.
 * Shown once; only the hash is stored, so it cannot be looked up again.
 */
export async function create(
  repositoryId: number,
  userId: number,
  input: CreateIntegrationInput,
) {
  const isKeyTaken = await IntegrationModel.findOne({
    where: { key: input.key, ...visibleTo(repositoryId) },
  });
  if (isKeyTaken) throw new IntegrationKeyTakenError(input.key);
  const token = crypto.randomBytes(24).toString('base64url');
  const integration = await IntegrationModel.create({
    key: input.key,
    name: input.name,
    icon: input.icon ?? 'mdi-webhook',
    type: IntegrationType.External,
    tokenHash: hashToken(token),
    repositoryId,
    createdById: userId,
  });
  logger.info({ repositoryId, key: input.key }, 'Integration registered');
  return { integration, token };
}

/**
 * Revokes an integration.
 */
export async function remove(repositoryId: number, id: number) {
  const integration = await IntegrationModel.findOne({
    where: { id, repositoryId },
  });
  if (!integration) throw new IntegrationNotFoundError();
  await integration.destroy();
}

/** Finds the integration a webhook token belongs to. */
export async function resolveByToken(token: string) {
  const integration = await IntegrationModel.findOne({
    where: {
      tokenHash: hashToken(token),
      type: IntegrationType.External,
      isEnabled: true,
    },
  });
  if (!integration) {
    throw new IntegrationNotFoundError('Unknown webhook token');
  }
  return integration as ExternalIntegration;
}

/**
 * Posts into every thread that subscribed to this integration.
 * A post may bring its own name, so one registration can
 * speak as "Deploy" and as "Tests".
 */
export async function postFromWebhook(
  integration: ExternalIntegration,
  payload: InboundWebhookInput,
) {
  const { id: integrationId, repositoryId, key, name } = integration;
  const threads = await threadService.subscribedThreads(
    repositoryId,
    `integration:${key}`,
  );
  if (!threads.length) throw new NoSubscriberError();
  const attachments = payload.attachments ?? [];
  const content =
    payload.text?.trim() ||
    attachments.map(resolveAttachmentSummary).filter(Boolean).join('\n') ||
    `${name} posted an update`;
  const senderEmoji = payload.icon_emoji
    ? parseShortcode(payload.icon_emoji.trim())
    : null;
  return Promise.all(
    threads.map((thread: any) =>
      commentService.createIntegrationMessage({
        integrationId,
        repositoryId,
        threadId: thread.id,
        content,
        senderName: payload.username?.trim() || null,
        senderEmoji,
        attachments: attachments.length ? attachments : null,
      }),
    ),
  );
}
