// Pages the assistant is still working on, kept per agent session in the
// shared KV store until save_interactive stores them.
import { randomUUID } from 'node:crypto';
import Keyv from 'keyv';

import { createAiLogger } from '../../../logger.ts';
import { kvStore as kvConfig } from '#config';
import type { ToolContext } from '../types.ts';

const NAMESPACE = 'agent:ctx:interactive';
const DRAFT_TTL_MS = 2 * 24 * 60 * 60 * 1000;

const logger = createAiLogger(NAMESPACE);

export interface InteractiveDraft {
  // Short id the model passes around.
  id: string;
  title: string;
  html: string;
  // Element the draft was opened from or saved to; saving updates it.
  elementId: number | null;
  createdAt: number;
  updatedAt: number;
}

export type NewDraft = Pick<InteractiveDraft, 'title' | 'html' | 'elementId'>;

class DraftStore {
  private readonly store: Keyv<InteractiveDraft>;
  // Storage key of the HTML file this session last saved per element.
  private readonly savedFiles: Keyv<string>;

  constructor() {
    const options = { ...kvConfig.keyvDefaultConfig, ttl: DRAFT_TTL_MS };
    this.store = new Keyv<InteractiveDraft>({ ...options, namespace: NAMESPACE });
    this.savedFiles = new Keyv<string>({
      ...options,
      namespace: `${NAMESPACE}:saved`,
    });
    for (const store of [this.store, this.savedFiles]) {
      store.on('error', (err) => logger.warn({ err }, 'KV store error'));
    }
  }

  get(ctx: ToolContext, id: string): Promise<InteractiveDraft | undefined> {
    return this.store.get(sessionKey(ctx, id));
  }

  async create(ctx: ToolContext, data: NewDraft): Promise<InteractiveDraft> {
    const now = Date.now();
    const draft = {
      id: randomUUID().slice(0, 8),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.set(sessionKey(ctx, draft.id), draft);
    return draft;
  }

  async save(ctx: ToolContext, draft: InteractiveDraft): Promise<void> {
    draft.updatedAt = Date.now();
    await this.store.set(sessionKey(ctx, draft.id), draft);
  }

  /**
   * Makes the HTML file just saved the element's latest in this session.
   * Returns the one it replaces, if any, so it can be cleaned up.
   */
  async replaceSavedFile(
    ctx: ToolContext,
    elementId: number,
    storageKey: string,
  ): Promise<string | undefined> {
    const key = sessionKey(ctx, `element-${elementId}`);
    const previous = await this.savedFiles.get(key);
    await this.savedFiles.set(key, storageKey);
    return previous;
  }
}

// Everything here belongs to the agent session it was made in
function sessionKey(ctx: ToolContext, id: string): string {
  const scope = ctx.sessionId ?? `${ctx.userId}:${ctx.repository.id}`;
  return `${scope}:${id}`;
}

export const draftStore = new DraftStore();
