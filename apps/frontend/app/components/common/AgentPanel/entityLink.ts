/**
 * Resolves agent-emitted entity references to FE URLs.
 */
export interface EntityLink {
  href: string;
  label: string;
  icon: string;
}

export type EntityKind = 'activity' | 'element';

export type BuildLink = (kind: string, id: number) => EntityLink | null;

const OPEN_ICON = 'mdi-arrow-top-right';

export function activityLink(
  repositoryId: number | string,
  activityId: number,
): EntityLink {
  return {
    href: `/repository/${repositoryId}/editor/${activityId}`,
    label: `Activity #${activityId}`,
    icon: OPEN_ICON,
  };
}

export function elementLink(
  repositoryId: number | string,
  activityId: number,
  elementUid: string,
  elementId: number,
): EntityLink {
  return {
    href:
      `/repository/${repositoryId}/editor/${activityId}` +
      `?elementId=${elementUid}`,
    label: `Element #${elementId}`,
    icon: OPEN_ICON,
  };
}
