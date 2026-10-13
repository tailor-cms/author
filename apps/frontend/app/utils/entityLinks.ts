import { parseElementRef } from '@tailor-cms/utils';
import { ReferenceType } from '@tailor-cms/interfaces/comment';

export function activityHref(
  repositoryId: number | string,
  activityId: number,
): string {
  return `/repository/${repositoryId}/editor/${activityId}`;
}

export function elementHref(
  repositoryId: number | string,
  outlineActivityId: number,
  uid: string,
): string {
  return `${activityHref(repositoryId, outlineActivityId)}?elementId=${uid}`;
}

export function assetHref(
  repositoryId: number | string,
  assetId: number | string,
): string {
  return `/repository/${repositoryId}/root/assets?assetId=${assetId}`;
}

export function referenceHref(
  repositoryId: number | string | null | undefined,
  { entityType, entityId }: { entityType: string; entityId: string },
): string | undefined {
  if (!repositoryId) return undefined;
  if (entityType === ReferenceType.Activity) {
    return activityHref(repositoryId, Number(entityId));
  }
  if (entityType === ReferenceType.Asset) {
    return assetHref(repositoryId, entityId);
  }
  if (entityType !== ReferenceType.Element) return undefined;
  const { outlineActivityId, uid } = parseElementRef(entityId);
  if (!outlineActivityId) return undefined;
  return elementHref(repositoryId, outlineActivityId, uid);
}
