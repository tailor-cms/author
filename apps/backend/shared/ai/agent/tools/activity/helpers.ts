// Activity-domain helpers: lookups, summaries, positioning, and tree queries.
// Content-element tools that need activity lookups import from here -
// the cross-slice import makes the domain boundary explicit.
import { schema as schemaAPI } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import type { ToolContext } from '../types.ts';
import { resolveLabel, stripSchemaPrefix } from '../helpers/index.ts';
import { pickElementFields } from '../content-elements/helpers.ts';

const { Activity } = db as any;
const api = schemaAPI as any;

// Find by PK + verify repo ownership. Returns null if not found or
// belongs to a different repository.
export async function findActivity(id: number, ctx: ToolContext) {
  const a = await Activity.findByPk(id);
  return a?.repositoryId === ctx.repository.id ? a : null;
}

// Compact summary for the model - includes the schema-derived label.
export function summarizeActivity(a: any) {
  const label = api.getActivityLabel?.(a) || stripSchemaPrefix(a.type);
  return {
    id: a.id,
    type: a.type,
    label,
    name: a.data?.name ?? a.data?.title ?? '',
    parentId: a.parentId ?? null,
    position: a.position,
  };
}

// Compute the next available position for a child activity under a given
// parent (or at root level if parentId is null).
// Returns MAX(position) + 1 among non-deleted, non-detached siblings.
// Returns 1 when no siblings exist yet.
// Uses unscoped() to bypass the default scope (Status table join);
// paranoid soft-delete filtering is preserved (model option, not a scope).
export async function nextPosition(
  repositoryId: number,
  parentId: number | null,
): Promise<number> {
  const max = await Activity.unscoped().max('position', {
    where: { repositoryId, parentId: parentId ?? null, detached: false },
  });
  return (Number(max) || 0) + 1;
}

// Recursively describe an activity and everything nested under it -
// child activities, their children, and content elements at each level.
export async function describeSubtree(
  schemaId: string,
  activity: any,
): Promise<any> {
  const [children, elements] = await Promise.all([
    activity.getChildren({
      where: { detached: false },
      order: [['position', 'ASC']],
    }),
    activity.getContentElements({
      where: { detached: false },
      order: [['position', 'ASC']],
    }),
  ]);
  const childDescriptions = await Promise.all(
    children.map((child: any) => describeSubtree(schemaId, child)),
  );
  return {
    id: activity.id,
    type: activity.type,
    label: resolveLabel(schemaId, activity.type),
    position: activity.position,
    data: activity.data || {},
    ...(elements.length ? { elements: elements.map(pickElementFields) } : {}),
    ...(childDescriptions.length ? { children: childDescriptions } : {}),
  };
}
