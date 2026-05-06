// Outline-context envelope for generation tools. Gives the LLM
// awareness of what already exists in the repository so generated
// content doesn't duplicate or pre-cover.
//
// Three tiers, closest = most detail:
//   1. Focused activity - full content summary
//   2. Nearest siblings - detailed summaries (default 2 each side)
//   3. Repository digest - outline tree, with cached leaf summaries
//      inlined where the per-activity cache already has them
import { schema as schemaAPI } from '@tailor-cms/config';

import { aiSummary } from './summarizer.ts';
import db from '#shared/database/index.js';
import { summaryStore } from './SummaryStore.ts';
import { resolveStatics } from '#shared/storage/helpers.js';
import type { ToolContext } from '../tools/types.ts';

const { Activity, ContentElement } = db as any;
const api = schemaAPI as any;

// How many siblings get detailed summaries on each side.
const NEAREST_SIBLINGS = 2;
const MAX_LEAF_SUMMARY_CHARS = 1000;

export interface OutlineContextOpts {
  // How many nearest siblings get detailed summaries.
  nearestSiblings?: number;
}

export interface OutlineNode {
  id: number;
  type: string;
  name: string;
  // Content summary if available
  summary?: string;
  // Branch-only: nested outline nodes
  children?: OutlineNode[];
}

export interface OutlineContextResult {
  focused: OutlineNode;
  ancestors: OutlineNode[];
  nearestPreceding: OutlineNode[];
  nearestFollowing: OutlineNode[];
  // The repository's outline tree with cached leaf summaries inlined.
  // Cheap structural map for cross-module awareness.
  repoDigest: OutlineNode[];
  repositoryIntent: string | null;
}

/**
 * Build a tiered context envelope for one activity. Returns null
 * when the activity doesn't exist or belongs to another repository.
 */
export async function buildOutlineContext(
  activityId: number,
  ctx: ToolContext,
  opts: OutlineContextOpts = {},
): Promise<OutlineContextResult | null> {
  const siblingsPerSide = opts.nearestSiblings ?? NEAREST_SIBLINGS;
  const activity = await Activity.findByPk(activityId);
  if (!activity || activity.repositoryId !== ctx.repository.id) return null;

  const [ancestors, siblings] = await Promise.all([
    activity.predecessors().then((list: any[] | undefined) => list ?? []),
    resolveSiblings(activity, ctx),
  ]);
  const focusedIndex = siblings.findIndex((a: any) => a.id === activity.id);
  const allPreceding = focusedIndex > 0 ? siblings.slice(0, focusedIndex) : [];
  const allFollowing =
    focusedIndex >= 0 ? siblings.slice(focusedIndex + 1) : [];

  const focusedSummary = await getActivitySummary(activity, ctx);
  // Preceding: keep the closest N that actually have content (skipping
  // empties handles non-sequential authoring). Following: keep the
  // closest N as-is - empty entries still tell the model "don't
  // pre-cover this".
  const nearestPreceding = (await summarizeAll(allPreceding, ctx))
    .filter((s) => s.summary)
    .slice(-siblingsPerSide);
  const nearestFollowing = await summarizeAll(
    allFollowing.slice(0, siblingsPerSide),
    ctx,
  );
  return {
    focused: { ...toRef(activity), summary: focusedSummary ?? undefined },
    ancestors: ancestors.map(toRef),
    nearestPreceding,
    nearestFollowing,
    repoDigest: await buildRepoDigest(ctx.repository.id),
    repositoryIntent: readRepositoryIntent(ctx.repository),
  };
}

/**
 * Compute (or return cached) summary for an activity's whole subtree.
 */
export async function getActivitySummary(
  activity: any,
  ctx: ToolContext,
): Promise<string | null> {
  // never cache foreign-repo content under this repo's namespace nor
  // feed the AI a cross-repo payload.
  if (activity.repositoryId !== ctx.repository.id) return null;
  const freshnessKey = activityFreshnessKey(activity);
  const cached = await summaryStore.get(
    ctx.repository.id,
    activity.id,
    freshnessKey,
  );
  if (cached) return cached.text;
  const { activities, elements } = await fetchSubtreeContent(activity);
  // Bail when the subtree carries no real content.
  if (!elements.length) return null;
  await Promise.all(elements.map(resolveStatics));
  // Keep only content-related fields
  const payload = JSON.stringify({
    activities: activities.map(pickActivityContent),
    elements: elements.map(pickElementContent),
  });
  const ai = await aiSummary(payload, pickName(activity));
  if (!ai) return null;
  const text = ai.slice(0, MAX_LEAF_SUMMARY_CHARS);
  await summaryStore.set(ctx.repository.id, activity.id, text, freshnessKey);
  return text;
}

/**
 * Build the repository digest: the outline tree, with cached leaf
 * summaries inlined where `summaryStore` already has them. One
 * Activity.findAll plus one cache peek per leaf - no AI calls.
 */
async function buildRepoDigest(repoId: number): Promise<OutlineNode[]> {
  const activities: any[] = await Activity.findAll({
    where: { repositoryId: repoId, detached: false },
    order: [
      ['parentId', 'ASC'],
      ['position', 'ASC'],
    ],
  });
  const outline = activities.filter((a) => api.isOutlineActivity(a.type));
  return buildAnnotatedTree(outline);
}

// Group outline activities by parentId, then materialise the tree
// recursively. For each leaf we peek the summary cache so any entry
// already populated by Tier 1/2 work shows up inline; cold leaves
// just render their title.
async function buildAnnotatedTree(activities: any[]): Promise<OutlineNode[]> {
  const byParent = new Map<number | null, any[]>();
  for (const activity of activities) {
    const key = activity.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(activity);
  }
  // Roots = anything whose parent isn't in the outline set.
  const known = new Set(activities.map((a) => a.id));
  const roots = activities.filter(
    (a) => a.parentId == null || !known.has(a.parentId),
  );
  roots.sort((a, b) => a.position - b.position);
  const buildNode = async (activity: any): Promise<OutlineNode> => {
    const childActivities = byParent.get(activity.id) ?? [];
    if (childActivities.length) {
      const children = await Promise.all(childActivities.map(buildNode));
      return { ...toRef(activity), children };
    }
    const cached = await summaryStore.get(
      activity.repositoryId,
      activity.id,
      activityFreshnessKey(activity),
    );
    return cached
      ? { ...toRef(activity), summary: cached.text }
      : toRef(activity);
  };
  return Promise.all(roots.map(buildNode));
}

/**
 * Render the context envelope as a compact markdown block, delimited
 * by ENVELOPE_OPEN / ENVELOPE_CLOSE. Sections are joined by blank
 * lines; empty sections are omitted entirely.
 */
export function formatEnvelope(ctx: OutlineContextResult): string {
  const ENVELOPE_OPEN = '--- OUTLINE CONTEXT ---';
  const ENVELOPE_CLOSE = '--- END CONTEXT ---';
  const sections: string[] = [];
  if (ctx.repositoryIntent) {
    sections.push(`Intent: ${ctx.repositoryIntent}`);
  }
  sections.push(formatPathLine(ctx));
  if (ctx.focused.summary) {
    sections.push(`Already inside THIS activity: ${ctx.focused.summary}`);
  }
  if (ctx.nearestPreceding.length) {
    sections.push(
      formatSiblingBlock('Preceding (do not duplicate):', ctx.nearestPreceding),
    );
  }
  if (ctx.nearestFollowing.length) {
    sections.push(
      formatSiblingBlock('Following (do not pre-cover):', ctx.nearestFollowing),
    );
  }
  if (ctx.repoDigest.length) {
    sections.push([
      'Repository structure (broader context):',
      ...renderTreeLines(ctx.repoDigest),
    ].join('\n'));
  }
  return [ENVELOPE_OPEN, sections.join('\n\n'), ENVELOPE_CLOSE].join('\n');
}

function formatPathLine(ctx: OutlineContextResult): string {
  if (!ctx.ancestors.length) {
    return `Focused: "${ctx.focused.name}" (root level)`;
  }
  const path = ctx.ancestors.map((a) => `"${a.name}"`).join(' > ');
  return `Path: ${path} > "${ctx.focused.name}" (focused)`;
}

function formatSiblingBlock(heading: string, siblings: OutlineNode[]): string {
  const rows = siblings.map((s) =>
    s.summary
      ? `- "${s.name}": ${s.summary}`
      : `- "${s.name}" (no content yet)`,
  );
  return [heading, ...rows].join('\n');
}

function renderTreeLines(nodes: OutlineNode[], depth = 0): string[] {
  const indent = '  '.repeat(depth);
  return nodes.flatMap((node) => {
    const head = node.summary
      ? `${indent}- ${node.name}: ${node.summary}`
      : `${indent}- ${node.name}`;
    return node.children?.length
      ? [head, ...renderTreeLines(node.children, depth + 1)]
      : [head];
  });
}

export interface EnvelopeResult {
  instructions: string;
  meta: { charBudget: number; charBudgetUsed: number } | null;
}

/**
 * Build the envelope and prepend it to the user's instructions.
 */
export async function prependEnvelope(
  anchorActivityId: number,
  instructions: string,
  ctx: ToolContext,
  opts?: { skip?: boolean; nearestSiblings?: number },
): Promise<EnvelopeResult> {
  if (opts?.skip) return { instructions, meta: null };
  const envelope = await buildOutlineContext(anchorActivityId, ctx, {
    nearestSiblings: opts?.nearestSiblings,
  });
  if (!envelope) return { instructions, meta: null };
  const formatted = formatEnvelope(envelope);
  const combined = `${formatted}\n\nUser instructions: ${instructions}`;
  return {
    instructions: combined,
    meta: {
      charBudget: combined.length,
      charBudgetUsed: formatted.length,
    },
  };
}

async function resolveSiblings(
  activity: any,
  ctx: ToolContext,
): Promise<any[]> {
  return Activity.findAll({
    where: {
      repositoryId: ctx.repository.id,
      parentId: activity.parentId ?? null,
      detached: false,
    },
    order: [['position', 'ASC']],
  });
}

// Pull every activity AND every content element in a subtree.
async function fetchSubtreeContent(
  activity: any,
): Promise<{ activities: any[]; elements: any[] }> {
  const { nodes } = await activity.descendants();
  const elements = await ContentElement.findAll({
    where: {
      repositoryId: activity.repositoryId,
      activityId: nodes.map((n: any) => n.id),
      detached: false,
    },
    order: [
      ['activityId', 'ASC'],
      ['position', 'ASC'],
    ],
  });
  return { activities: nodes, elements };
}

async function summarizeAll(
  activities: any[],
  ctx: ToolContext,
): Promise<OutlineNode[]> {
  return Promise.all(
    activities.map(async (a) => ({
      ...toRef(a),
      summary: (await getActivitySummary(a, ctx)) ?? undefined,
    })),
  );
}

function activityFreshnessKey(activity: any): string {
  return String(activity.modifiedAt?.getTime?.() || 0);
}

// Drop certai keys before sending to the summarizer.
// `data.$$` is Tailor's reserved bucket for system metadata
function stripAdminDataKeys(
  data: Record<string, any> | null | undefined,
): Record<string, any> | null | undefined {
  if (!data || typeof data !== 'object') return data;
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !key.startsWith('$$')),
  );
}

function pickActivityContent(activity: any) {
  const plain = activity.toJSON?.() ?? activity;
  return {
    id: plain.id,
    type: plain.type,
    parentId: plain.parentId ?? null,
    data: stripAdminDataKeys(plain.data),
  };
}

function pickElementContent(element: any) {
  const plain = element.toJSON?.() ?? element;
  return {
    activityId: plain.activityId,
    type: plain.type,
    data: plain.data,
  };
}

function toRef(activity: any): OutlineNode {
  return { id: activity.id, type: activity.type, name: pickName(activity) };
}

function pickName(activity: any): string {
  return (
    activity?.data?.name || activity?.data?.title || `#${activity?.id ?? '?'}`
  );
}

function readRepositoryIntent(repo: any): string | null {
  const raw =
    repo?.data?.$$?.ai?.intent ?? repo?.data?.aiIntent ?? repo?.data?.intent;
  if (typeof raw !== 'string') return null;
  return raw.trim().slice(0, 500) || null;
}
