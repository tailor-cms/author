import type { Asset } from '@tailor-cms/interfaces/asset.ts';
import { parseElementRef } from '@tailor-cms/utils';
import { ReferenceType } from '@tailor-cms/interfaces/comment';

import { api } from '@/api';
import { findAsset } from '../sharedAssets';
import { useCurrentRepository } from '@/stores/current-repository';

export interface ReferenceTarget {
  entityType: string;
  entityId: string;
  label?: string;
}

export interface ReferencePreview {
  kind: ReferenceType;
  title: string;
  subtitle?: string;
  asset?: Asset;
  element?: any;
}

type Loader = (
  entityId: string,
) => Promise<ReferencePreview | null> | ReferencePreview | null;

export const useReferencePreview = () => {
  const { $ceRegistry, $schemaService } = useNuxtApp() as any;
  const repoStore = useCurrentRepository();

  const loadElement: Loader = async (entityId) => {
    const repositoryId = repoStore.repositoryId as number;
    const { uid } = parseElementRef(entityId);
    const result: any = await api.contentElement.list({
      params: { repositoryId },
      query: { uids: uid } as any,
    });
    const element = (result?.items ?? result ?? [])[0];
    if (!element) return null;
    return {
      kind: ReferenceType.Element,
      title: $ceRegistry?.get?.(element.type)?.name ?? element.type,
      element,
    };
  };

  const loadAsset: Loader = async (entityId) => {
    const repositoryId = repoStore.repositoryId as number;
    const asset = await findAsset(repositoryId, entityId);
    if (!asset) return null;
    return {
      kind: ReferenceType.Asset,
      title: asset.name,
      subtitle: asset.type,
      asset,
    };
  };

  const loadActivity: Loader = (entityId) => {
    const activity = repoStore.outlineActivities.find(
      (it: any) => String(it.id) === entityId,
    );
    if (!activity) return null;
    return {
      kind: ReferenceType.Activity,
      title: activity.data?.name ?? 'Untitled',
      subtitle: $schemaService?.getLevel?.(activity.type)?.label,
    };
  };

  const loaders: Partial<Record<ReferenceType, Loader>> = {
    [ReferenceType.Element]: loadElement,
    [ReferenceType.Asset]: loadAsset,
    [ReferenceType.Activity]: loadActivity,
  };

  const resolve = async ({
    entityType,
    entityId,
  }: ReferenceTarget): Promise<ReferencePreview | null> => {
    const load = loaders[entityType as ReferenceType];
    if (!load) return null;
    try {
      return await load(entityId);
    } catch {
      // A failed load reads as a missing entity
      return null;
    }
  };

  return { resolve };
};
