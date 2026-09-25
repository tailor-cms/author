import type { Emoji } from '@tailor-cms/api-client';
import { api } from '@/api';

const byNameAsc = (a: Emoji, b: Emoji) => a.name.localeCompare(b.name);

/**
 * The workspace's custom emoji; fetched once.
 */
export const useEmojiStore = defineStore('emoji', () => {
  const items = ref<Emoji[]>([]);
  const isLoaded = ref(false);

  const byName = computed(
    () => new Map(items.value.map((it) => [it.name, it])),
  );

  const get = (name: string) => byName.value.get(name);

  const search = (query: string, limit = 10) => {
    const term = query.trim().toLowerCase();
    if (!term) return items.value.slice(0, limit);
    return items.value
      .filter((it) => it.name.includes(term))
      .slice(0, limit);
  };

  async function fetch() {
    items.value = await api.workspace.getEmoji();
    isLoaded.value = true;
    return items.value;
  }

  async function add(name: string, image: File) {
    const emoji = await api.workspace.createEmoji({
      body: { name, image },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    items.value = [...items.value, emoji].sort(byNameAsc);
    return emoji;
  }

  async function remove(id: number) {
    await api.workspace.removeEmoji({ params: { emojiId: id } });
    items.value = items.value.filter((it) => it.id !== id);
  }

  return { items, isLoaded, get, search, fetch, add, remove };
});
