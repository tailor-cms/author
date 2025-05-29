import { get, isEmpty, reduce } from 'lodash-es';
import { lower, title as toTitleCase } from 'to-case';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { Entity, type Revision } from '@tailor-cms/interfaces/revision';
import { schema } from '@tailor-cms/config';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

const describe = {
  [Entity.Repository]: describeRepositoryRevision,
  [Entity.Activity]: describeActivityRevision,
  [Entity.ContentElement]: describeElementRevision,
};

function getAction(operation: string) {
  switch (operation) {
  case 'CREATE':
    return 'Created';
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
    : toTitleCase(activity.type);
}

function getContainerContext(activity: Activity) {
  if (!activity) return '';
  const name = get(activity, 'data.name');
  const typeLabel = getActivityTypeLabel(activity);
  return `within ${name} ${typeLabel}`;
}

function describeActivityRevision(rev: Revision, activity: Activity) {
  const state = rev.state as Activity;
  const name = get(rev, 'state.data.name', '');
  const typeLabel = getActivityTypeLabel(state);
  const action = getAction(rev.operation);
  const activityConfig = schema.getLevel(state.type);
  const containerContext = activityConfig.rootLevel
    ? ''
    : getContainerContext(activity);
  return `${action} ${name} ${lower(typeLabel)} ${containerContext}`;
}

function describeElementRevision(rev: Revision, activity: Activity) {
  const action = getAction(rev.operation);
  const activityText = activity
    ? getContainerContext(activity)
    : 'within deleted container';
  const state = rev.state as ContentElement;
  return `${action} ${lower(state.type)} element ${activityText}`;
}

function describeRepositoryRevision(rev: Revision) {
  return `${getAction(rev.operation)} repository`;
}

export function isSameInstance(a: Revision, b: Revision) {
  return a.entity === b.entity && a.state.id === b.state.id;
}

export function getFormatDescription(rev: Revision, activity: Activity) {
  return describe[rev.entity](rev, activity);
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
  const DEFAULT_COLOR = 'primary-lighten-4';
  switch (rev.entity) {
  case Entity.Activity: {
    const state = rev.state as Activity;
    const config = schema.getLevel(state.type);
    return !isEmpty(config) ? config.color : DEFAULT_COLOR;
  }
  case Entity.Repository:
    return 'primary-lighten-4';
  case Entity.ContentElement:
    return 'teal-lighten-4';
  default:
    return DEFAULT_COLOR;
  }
}
