import type {
  ContentElement,
  ContentElementAttrs,
} from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Revision } from '@tailor-cms/interfaces/revision';
import { Entity, Operation } from '@tailor-cms/interfaces/revision';
import { get, isEmpty, isEqual, last, reduce } from 'lodash-es';
import { lowerCase, titleCase } from '@tailor-cms/utils';
import { formatDate } from '@vueuse/core';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
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

// A revision annotated with the message explaining why its restore is
// disabled; null when it isn't.
export type RestorableRevision = Revision & {
  restoreDisabledMsg: string | null;
};

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
  const state = rev.state as unknown as Activity;
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
  const state = rev.state as unknown as ContentElement;
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

const asElementState = (state: Revision['state']) =>
  state as unknown as ContentElementAttrs;

/**
 * The fields a restore writes back onto a content element.
 */
export function getCeRestorePayload(state: Revision['state']) {
  const { position, data, meta, refs } = asElementState(state);
  return { position, data, meta, refs };
}

/**
 * Message explaining why restoring `revision` is disabled, or null when it
 * can be restored. `current` is the newest revision's state, newest is
 * not the same as current content e.g.: deleting an element's text makes an older
 * state current again, so restoring it would write nothing and leave the user
 * with a silent no-op.
 */
export function getRestoreDisabledMsg(
  revision: Revision,
  current?: Revision['state'],
): string | null {
  if (revision.operation === Operation.Remove) {
    return 'This version deleted the element';
  }
  if (!current) return null;
  const live = asElementState(current);
  // A soft-deleted element is always restorable
  if (live.deletedAt) return null;
  // The signature is a sha of `data` alone, so it only short-circuits the
  // common case; position/meta/refs still need comparing.
  const target = asElementState(revision.state);
  if (target.contentSignature !== live.contentSignature) return null;
  return isEqual(getCeRestorePayload(revision.state), getCeRestorePayload(current))
    ? 'This is the current version'
    : null;
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
      const state = rev.state as unknown as Activity;
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
      const state = rev.state as unknown as Activity;
      const config = schema.getLevel(state.type);
      return !isEmpty(config) ? config.color : DEFAULT_COLOR;
    }
    case Entity.Repository:
      return 'secondary';
    case Entity.ContentElement:
      return 'tertiary';
    default:
      return DEFAULT_COLOR;
  }
}
