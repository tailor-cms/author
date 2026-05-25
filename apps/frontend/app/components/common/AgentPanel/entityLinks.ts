/**
 * Editor URL builders for agent-emitted entity references.
 */
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
