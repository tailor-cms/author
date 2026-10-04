import type { Message } from '@tailor-cms/interfaces/comment';
import type { MessagingCreateReq } from '@tailor-cms/api-client';

import { merge as deepMerge } from 'lodash-es';
import { api } from '@/api';

type SaveInput = MessagingCreateReq['body'] & {
  repositoryId: number;
  id?: number;
};

/**
 * A cache for all messages loaded by the app, keyed by their ID.
 */
export const createMessageCache = () => {
  const entries = reactive(new Map<number, Message>());

  const get = (id?: number | null) => (id ? entries.get(id) : undefined);

  // The cached messages for these ids, in order, skipping any not loaded
  const getMany = (ids: number[] = []) =>
    ids.map((id) => entries.get(id)).filter((it): it is Message => !!it);

  // The cached messages that match; a type guard narrows the result
  function where<T extends Message>(match: (it: Message) => it is T): T[];
  function where(match: (it: Message) => boolean): Message[];
  function where(match: (it: Message) => boolean) {
    return Array.from(entries.values()).filter(match);
  }

  function setLocal(message: Message): Message {
    entries.set(message.id, message);
    return entries.get(message.id) as Message;
  }

  function mergeLocal(id: number, changes: Partial<Message>) {
    const message = entries.get(id);
    if (!message) return;
    const merged = deepMerge(message, changes);
    if (changes.reactions) merged.reactions = changes.reactions;
    entries.set(id, merged);
  }

  // Posts a new message, or edits the text of an existing one
  async function save(payload: SaveInput) {
    const { id, repositoryId, content, ...createOnly } = payload;
    const message = id
      ? await api.messaging.update({
          params: { repositoryId, messageId: id },
          body: { content },
        })
      : await api.messaging.create({
          params: { repositoryId },
          body: { content, ...createOnly },
        });
    return setLocal(message as Message);
  }

  // Deleting keeps the message, without its text, so replies keep a parent
  async function remove(repositoryId: number, id: number) {
    if (!entries.has(id)) throw new Error('Message not found');
    const deleted = await api.messaging.delete({
      params: { repositoryId, messageId: id },
    });
    mergeLocal(id, deleted as Partial<Message>);
  }

  async function toggleReaction(
    repositoryId: number,
    id: number,
    emoji: string,
  ) {
    if (!entries.has(id)) throw new Error('Message not found');
    const updated = await api.messaging.toggleReaction({
      params: { repositoryId, messageId: id },
      body: { emoji },
    });
    mergeLocal(id, updated as Partial<Message>);
    return entries.get(id);
  }

  const clear = () => entries.clear();

  return {
    get,
    getMany,
    where,
    setLocal,
    mergeLocal,
    save,
    remove,
    toggleReaction,
    clear,
  };
};

export type MessageCache = ReturnType<typeof createMessageCache>;
