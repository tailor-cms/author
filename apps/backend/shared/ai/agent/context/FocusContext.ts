import type { FocusedTarget } from '@tailor-cms/interfaces/agent.ts';
import { Entity } from '@tailor-cms/interfaces/revision.ts';

import db from '#shared/database/index.js';

const { Activity, ContentElement } = db as any;

const FOOTER = [
  'Resolve pronouns ("this", "it", "the topic") to the focused target',
  'above unless the user clearly disambiguates. Acknowledge the target',
  'id in your first sentence so the user knows you understood. For an',
  'element with [embed:UID], the focused piece is a sub-element inside',
  `the parent element's data.embeds map.`,
].join(' ');

// Build the per-turn editor-state header prepended to the user message
// so the agent can resolve pronouns ("this", "the topic") without an
// extra read. Returns '' when the client didn't supply focus.
export async function buildFocusHeader(
  targets: FocusedTarget[] | undefined,
  repository: any,
): Promise<string> {
  if (!targets?.length) return '';
  const lines: string[] = [`[Editor state at ${new Date().toISOString()}]`];
  lines.push(
    `- Repository: #${repository.id} ` +
      `${repository.name} (${repository.schema})`,
  );
  for (const focus of targets) {
    const line = focus.kind === Entity.Activity
      ? await formatActivity(focus, repository.id)
      : focus.kind === Entity.ContentElement
        ? await formatElement(focus, repository.id)
        : null;
    if (line) lines.push(line);
  }
  lines.push('', FOOTER);
  return lines.join('\n');
}

async function formatActivity(
  focus: FocusedTarget,
  repositoryId: number,
): Promise<string | null> {
  const activity = await Activity.findByPk(focus.id);
  if (activity?.repositoryId !== repositoryId) return null;
  const name = activity.data?.name || activity.data?.title || '(untitled)';
  return `- Focused activity: #${activity.id} (${activity.type}) "${name}"`;
}

async function formatElement(
  focus: FocusedTarget,
  repositoryId: number,
): Promise<string | null> {
  const element = await ContentElement.findByPk(focus.id);
  if (element?.repositoryId !== repositoryId) return null;
  const type = `(${element.type}) `;
  const label = focus.label ? `${focus.label}` : '';
  const embed = focus.embedUid ? ` [embed:${focus.embedUid}]` : '';
  return `- Focused element: #${element.id} ${type}${label}${embed}`;
}
