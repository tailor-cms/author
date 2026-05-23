// Durable session registry for the authoring agent, backed by the shared
// Keyv KV adapter (apps/backend/config/kvStore.js).
//
// Two-tier storage:
//   agent:ctx:session         sessionId (UUID)        -> AgentSessionData
//   agent:ctx:session:active  `${userId}:${repoId}`   -> sessionId
//
// Sessions live under their UUID forever (within TTL). Many sessions
// can exist for the same (user, repo) pair - history is preserved,
// nothing is overwritten. The "active" pointer is a per-(user, repo)
// DEFAULT: it answers "which session do implicit run calls continue?"
// - not "which session does this user have access to".
//
// Two access modes:
//   - implicit  (no sessionId in body) -> follow this (user, repo)'s
//                                         active pointer
//                                         "pick up where I left off"
//   - explicit  (sessionId provided)   -> direct UUID lookup
//                                         "open this specific chat"
//
// One default per (user, repo) keeps the zero-state on
// the client (refresh-safe, cross-device) while still allowing
// parallel tracks - the client is free to render N sessions in a
// sidebar and pass sessionId explicitly when the user picks one.
//
// This mirrors git: a session UUID is like a commit hash (immutable,
// always reachable); the active pointer is like HEAD.
//
// Examples (user 7, repo 42):
//
//   1) First run, no sessionId
//      -> active "7:42" missing -> create() new UUID "abc"
//         sessions: { abc -> data }
//         active:   { 7:42 -> abc }
//
//   2) Next implicit run
//      -> active "7:42" -> "abc" -> reuse session, append turn to history
//
//   3) "New conversation" (POST /sessions)
//      -> create() new UUID "def", overwrite active "7:42" -> "def"
//         "abc" still in storage, reachable via explicit sessionId
//
//   4) Open old session via URL (sessionId="abc")
//      -> direct get("abc"), active pointer untouched (still "def")
//
// TTL is 7 days on both tiers. Every save() re-asserts the active
// pointer, so as long as the user is active the pointer's TTL never
// runs out. Per-user keying ("${userId}:${repoId}") prevents users
// from sharing or stumbling onto each other's conversations.
import { randomUUID } from 'node:crypto';
import Keyv from 'keyv';
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import { kvStore as kvConfig } from '#config';

import { AgentSession, type AgentSessionData } from './AgentSession.ts';

// 7 days - long enough that authoring picks back up the next day; short
// enough to stop stale sessions from piling up in Redis indefinitely.
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NS_SESSIONS = 'agent:ctx:session';
const NS_ACTIVE = `${NS_SESSIONS}:active`;

type SessionId = string;
type ActiveKey = `${number}:${number}`;
type SessionEntry = [SessionId, AgentSessionData];

class SessionStore {
  private readonly sessions: Keyv<AgentSessionData>;
  private readonly active: Keyv<SessionId>;

  constructor() {
    this.sessions = createStore<AgentSessionData>(NS_SESSIONS);
    this.active = createStore<SessionId>(NS_ACTIVE);
  }

  /**
   * Explicit new session. Always generates a fresh UUID and points the
   * (userId, repositoryId) active pointer at it. Any previous active
   * session remains reachable by its own sessionId but is no longer
   * the "current" one.
   */
  async create(
    repositoryId: number,
    userId: number,
    mode: AgentMode = AgentMode.Edit,
  ): Promise<AgentSession> {
    const now = Date.now();
    const session = new AgentSession({
      id: randomUUID(),
      repositoryId,
      userId,
      createdAt: now,
      updatedAt: now,
      history: [],
      transactionLog: [],
      mode,
    });
    await this.persist(session);
    return session;
  }

  async get(id: SessionId): Promise<AgentSession | undefined> {
    const raw = await this.sessions.get(id);
    return raw ? new AgentSession(raw) : undefined;
  }

  // The current active session for a (repositoryId, userId) pair, if any.
  async getActive(
    repositoryId: number,
    userId: number,
  ): Promise<AgentSession | undefined> {
    const id = await this.active.get(activeKey(repositoryId, userId));
    return id ? this.get(id) : undefined;
  }

  /**
   * Reuse the active session if present; otherwise create a fresh one.
   * The natural fit for `POST /agent/run` with no sessionId in the body -
   * the user's "current conversation for this repo" is resolved in one call.
   */
  async getOrCreate(
    repositoryId: number,
    userId: number,
    mode: AgentMode = AgentMode.Edit,
  ): Promise<AgentSession> {
    const existing = await this.getActive(repositoryId, userId);
    return existing ?? this.create(repositoryId, userId, mode);
  }

  async save(session: AgentSession): Promise<void> {
    session.updatedAt = Date.now();
    await this.persist(session);
  }

  async list(
    repositoryId: number,
    userId: number,
  ): Promise<AgentSession[]> {
    const results: AgentSession[] = [];
    const iterator = (this.sessions as any).iterator?.();
    if (!iterator) return results;
    for await (const [, raw] of iterator as AsyncIterable<SessionEntry>) {
      if (!raw || raw.repositoryId !== repositoryId || raw.userId !== userId) {
        continue;
      }
      results.push(new AgentSession(raw));
    }
    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async delete(id: SessionId): Promise<void> {
    const raw = await this.sessions.get(id);
    await this.sessions.delete(id);
    if (!raw) return;
    // Only clear the active pointer if it still points at the deleted
    const key = activeKey(raw.repositoryId, raw.userId);
    const currentActive = await this.active.get(key);
    if (currentActive === id) await this.active.delete(key);
  }

  /**
   * Writes the session and (re-)asserts the active pointer. Re-asserting
   * refreshes the active TTL and restores the pointer if the Redis key
   * was evicted between writes.
   */
  private async persist(session: AgentSession): Promise<void> {
    await this.sessions.set(session.id, session);
    await this.active.set(
      activeKey(session.repositoryId, session.userId),
      session.id,
    );
  }
}

function activeKey(repositoryId: number, userId: number): ActiveKey {
  return `${userId}:${repositoryId}`;
}

function createStore<T>(namespace: string): Keyv<T> {
  const keyv = new Keyv<T>({
    ...kvConfig.keyvDefaultConfig,
    namespace,
    ttl: SESSION_TTL_MS,
  });
  keyv.on('error', (err) =>
    console.warn(`[${namespace}]`, err?.message ?? err),
  );
  return keyv;
}

export const sessionStore = new SessionStore();
