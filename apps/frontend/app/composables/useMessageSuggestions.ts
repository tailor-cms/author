import type { Asset } from '@tailor-cms/interfaces/asset';
import type { RepositoryMember } from '@tailor-cms/interfaces/repository';
import type { SuggestionItem } from '@tailor-cms/core-components';
import { api, repositoryAsset } from '@/api';
import { decode } from 'html-entities';
import { elementRefId } from '@tailor-cms/utils';
import { ReferenceType } from '@tailor-cms/interfaces/comment';
import { useCurrentRepository } from '@/stores/current-repository';

const MAX_ROWS_PER_SOURCE = 6;
const MAX_REFERENCE_ROWS = MAX_ROWS_PER_SOURCE * 2;
const MIN_QUERY_LENGTH = 2;

// Search wraps each match in ⟪⟫; a menu row shows plain text
const snippetText = (snippet?: string | null) =>
  decode(snippet ?? '').replace(/[⟪⟫]/g, '').trim();

const matchesQuery = (text: string, query: string) =>
  text.toLowerCase().includes(query.toLowerCase());

const toUserSuggestion = (user: RepositoryMember): SuggestionItem => ({
  value: String(user.id),
  label: user.label || user.email,
  subtitle: user.email,
  avatar: user.imgUrl,
});

/**
 * Who `@` can mention and what `#` can point at in the message composer.
 */
export const useMessageSuggestions = (
  repositoryId: MaybeRefOrGetter<number>,
) => {
  const { $ceRegistry } = useNuxtApp() as any;
  const repoStore = useCurrentRepository();
  const { getActivityName } = useActivityName();

  // The extension's display name instead of its type id
  const elementName = (element: { type: string; data: unknown }) =>
    $ceRegistry.getByEntity(element)?.name ?? element.type;

  const suggestUsers = (query: string) =>
    repoStore.users
      .filter((it) => matchesQuery(`${it.label} ${it.email}`, query))
      .slice(0, MAX_ROWS_PER_SOURCE)
      .map(toUserSuggestion);

  const suggestActivities = (query: string): SuggestionItem[] =>
    repoStore.outlineActivities
      .map((it) => ({ id: it.id, name: getActivityName(it) }))
      .filter((it) => matchesQuery(it.name, query))
      .slice(0, MAX_ROWS_PER_SOURCE)
      .map(({ id, name }) => ({
        value: String(id),
        label: name || 'Untitled',
        subtitle: 'Activity',
        entityType: ReferenceType.Activity,
      }));

  const suggestElements = async (query: string): Promise<SuggestionItem[]> => {
    const { items } = await api.contentElement.search({
      params: { repositoryId: toValue(repositoryId) },
      query: { search: query, limit: MAX_ROWS_PER_SOURCE },
    });
    return items.map((it) => ({
      value: elementRefId(it.outlineActivityId, it.uid),
      label: snippetText(it.searchSnippet) || elementName(it),
      subtitle: 'Element',
      entityType: ReferenceType.Element,
    }));
  };

  const assetThumbnail = (asset: Asset) =>
    asset.meta?.hasThumbnail
      ? repositoryAsset.getThumbnailUrl(toValue(repositoryId), asset.id)
      : undefined;

  const suggestAssets = async (query: string): Promise<SuggestionItem[]> => {
    const { items }: { items: Asset[] } = await repositoryAsset.list(
      toValue(repositoryId),
      { search: query, limit: MAX_ROWS_PER_SOURCE },
    );
    return items.map((it) => ({
      value: String(it.id),
      label: it.name,
      subtitle: 'Asset',
      avatar: assetThumbnail(it),
      entityType: ReferenceType.Asset,
    }));
  };

  const suggestReferences = async (query: string) => {
    const activities = suggestActivities(query);
    const hasRoom = activities.length < MAX_ROWS_PER_SOURCE;
    if (!hasRoom || query.length < MIN_QUERY_LENGTH) return activities;
    const [elements, assets] = await Promise.all([
      suggestElements(query).catch(() => []),
      suggestAssets(query).catch(() => []),
    ]);
    return [...activities, ...elements, ...assets].slice(0, MAX_REFERENCE_ROWS);
  };

  return { suggestUsers, suggestReferences };
};
