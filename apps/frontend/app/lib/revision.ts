import { get, isEmpty, last, reduce } from 'lodash-es';
import { lowerCase, titleCase } from '@tailor-cms/utils';
import { formatDate } from '@vueuse/core';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { Entity } from '@tailor-cms/interfaces/revision';
import type { Revision } from '@tailor-cms/interfaces/revision';
import { schema } from '@tailor-cms/config';

// A history-list row: a real revision, or a synthetic restore entry standing for
// a whole cascade - so it has no single entity/operation/state to speak of.
export interface RestoreEntry {
  isRestore: true;
  uid: string;
  createdAt: string;
  user?: Revision['user'];
  transactionId: string;
}
export type HistoryEntry = (Revision & { isRestore?: false }) | RestoreEntry;

interface DescribeOptions {
  // Drop the "within {parent} {type}" suffix - for views already scoped to one
  // activity (e.g. the editor history sidebar) where the parent is implicit.
  omitContainer?: boolean;
}

const describe = {
  [Entity.Repository]: describeRepositoryRevision,
  [Entity.Activity]: describeActivityRevision,
  [Entity.ContentElement]: describeElementRevision,
};

interface LinkedEntity {
  isLinkedCopy?: boolean;
}

function getAction(operation: string, state?: LinkedEntity) {
  switch (operation) {
    case 'CREATE':
      return state?.isLinkedCopy ? 'Linked' : 'Created';
    case 'REMOVE':
      return 'Removed';
    case 'UPDATE':
    default:
      return 'Updated';
  }
}

function getActivityTypeLabel(activity: Activity) {
  if (!activity) return '';
  const activityConfig = schema.getLevel(activity.type);
  return !isEmpty(activityConfig)
    ? activityConfig.label
    : titleCase(activity.type);
}

function getContainerContext(activity: Activity) {
  if (!activity) return '';
  const name = get(activity, 'data.name');
  const typeLabel = getActivityTypeLabel(activity);
  return `within ${name} ${typeLabel}`;
}

function describeActivityRevision(
  rev: Revision,
  activity: Activity,
  opts: DescribeOptions = {},
) {
  const state = rev.state as Activity;
  const typeLabel = lowerCase(getActivityTypeLabel(state));
  const action = getAction(rev.operation, state);

  // Also drop the entity's own name (implicit here too); "details" stops
  // "Updated page" from reading as vague - it's a metadata change.
  if (opts.omitContainer) {
    const suffix = rev.operation === 'UPDATE' ? ' details' : '';
    return `${action} ${typeLabel}${suffix}`;
  }

  const name = get(rev, 'state.data.name', '');
  const activityConfig = schema.getLevel(state.type);
  const containerContext = activityConfig.rootLevel
    ? ''
    : getContainerContext(activity);
  return `${action} ${name} ${typeLabel} ${containerContext}`.trim();
}

function describeElementRevision(
  rev: Revision,
  activity: Activity,
  opts: DescribeOptions = {},
) {
  const state = rev.state as ContentElement;
  const action = getAction(rev.operation, state);
  const activityText = opts.omitContainer
    ? ''
    : activity
      ? getContainerContext(activity)
      : 'within deleted container';
  return `${action} ${lowerCase(state.type)} element ${activityText}`.trim();
}

function describeRepositoryRevision(rev: Revision) {
  return `${getAction(rev.operation)} repository`;
}

export interface DayGroup<T> {
  key: string;
  label: string;
  items: T[];
}

function dayLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date, 'MMMM Do, YYYY');
}

/**
 * Buckets a DESC-ordered list of dated entries into calendar-day groups. A
 * single linear pass suffices because the input is already sorted newest-first.
 */
export function groupByDay<T extends { createdAt: string | Date }>(
  items: T[],
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const date = new Date(item.createdAt);
    const key = formatDate(date, 'YYYY-MM-DD');
    const current = last(groups);
    if (current?.key === key) current.items.push(item);
    else groups.push({ key, label: dayLabel(date), items: [item] });
  }
  return groups;
}

export function isSameInstance(a: Revision, b: Revision) {
  return a.entity === b.entity && a.state.id === b.state.id;
}

export function isSameRun(a: Revision, b: Revision) {
  return isSameInstance(a, b) && a.operation === b.operation;
}

export function getFormatDescription(
  rev: Revision,
  activity: Activity,
  opts: DescribeOptions = {},
) {
  return describe[rev.entity](rev, activity, opts);
}

export function getRevisionAcronym(rev: Revision) {
  switch (rev.entity) {
    case Entity.Activity: {
      const state = rev.state as Activity;
      const typeArray = state.type.split('_', 2);
      return reduce(typeArray, (acc, val) => acc + val.charAt(0), '');
    }
    case Entity.Repository:
      return 'R';
    case Entity.ContentElement:
      return 'CE';
    default:
      return 'N/A';
  }
}

export function getRevisionColor(rev: Revision) {
  const DEFAULT_COLOR = 'inverse-surface';
  switch (rev.entity) {
    case Entity.Activity: {
      const state = rev.state as Activity;
      const config = schema.getLevel(state.type);
      return !isEmpty(config) ? config.color : DEFAULT_COLOR;
    }
    case Entity.Repository:
      return 'tertiary';
    case Entity.ContentElement:
      return 'primary';
    default:
      return DEFAULT_COLOR;
  }
}
