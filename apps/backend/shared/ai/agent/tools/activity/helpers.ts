// Activity-domain helpers: lookups, summaries, positioning, and tree queries.
// Content-element tools that need activity lookups import from here -
// the cross-slice import makes the domain boundary explicit.
import { oneLine } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';

import {
  getAllowedElementTypes,
  getContainerActivityMeta,
  metaInputsForActivity,
  resolveLabel,
  stripSchemaPrefix,
  toolError,
} from '../helpers/index.ts';
import db from '#shared/database/index.js';
import type { ToolContext } from '../types.ts';
import { pickElementFields } from '../content-elements/helpers.ts';

const { Activity } = db as any;
const api = schemaAPI as any;

// Find by PK + verify repo ownership. Returns null if not found or
// belongs to a different repository.
export async function findActivity(id: number, ctx: ToolContext) {
  const a = await Activity.findByPk(id);
  return a?.repositoryId === ctx.repository.id ? a : null;
}

/**
 * Detect if an activity can host content elements and resolve its
 * allowed element types.
 */
export async function resolveElementHost(
  tool: string,
  activityId: number,
  ctx: ToolContext,
) {
  const host = await findActivity(activityId, ctx);
  if (!host) {
    return toolError({
      tool,
      reason: 'not_found',
      message: `Activity #${activityId} not found.`,
    });
  }
  if (api.isOutlineActivity(host.type)) {
    return toolError({
      tool,
      reason: 'outline_activity',
      message: oneLine`
        Activity #${host.id} (${host.type}) is an outline activity.
        Elements go into a content container inside it; call
        get_activity_subtree to find container ids.
      `,
    });
  }
  const parent = host.parentId ? await Activity.findByPk(host.parentId) : null;
  const allowedTypes: string[] = getAllowedElementTypes(
    ctx.repository.schema,
    host.type,
    parent?.type,
  );
  if (!allowedTypes.length) {
    return toolError({
      tool,
      reason: 'no_config',
      message: oneLine`
        Activity #${host.id} (${host.type}) cannot hold elements. Use
        get_activity_subtree to find the correct subcontainer id.
      `,
    });
  }
  return { host, allowedTypes };
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

/**
 * Schema-defined meta fields for an activity. Outline types store meta
 * on the level config; container subcontainers store it inside the
 * container template.
 */
export function getActivityMetaSchema(schemaId: string, type: string): any[] {
  return api.isOutlineActivity(type)
    ? metaInputsForActivity(type)
    : getContainerActivityMeta(schemaId, type);
}

/**
 * Schema-defined meta keys that are unset on this activity (null,
 * undefined, or empty string).
 */
export function computeMissingMeta(schemaId: string, activity: any): string[] {
  const data = activity.data || {};
  return getActivityMetaSchema(schemaId, activity.type)
    .filter((m: any) => data[m.key] == null || data[m.key] === '')
    .map((m: any) => m.key);
}

/**
 * Recursively describe an activity and everything nested under it -
 * child activities, their children, and content elements at each level.
 * Each node also carries a missingMeta list so the model can see
 * incomplete activities without diffing the schema itself - call
 * get_schema_info for the key types and labels.
 */
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
  const data = activity.data || {};
  const missingMeta = computeMissingMeta(schemaId, activity);
  return {
    id: activity.id,
    type: activity.type,
    label: resolveLabel(schemaId, activity.type),
    position: activity.position,
    data,
    ...(missingMeta.length ? { missingMeta } : {}),
    ...(elements.length ? { elements: elements.map(pickElementFields) } : {}),
    ...(childDescriptions.length ? { children: childDescriptions } : {}),
  };
}
