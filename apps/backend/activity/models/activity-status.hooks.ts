// ActivityStatus lifecycle hooks: SSE broadcast on create + email
// notification when the assignee changes.
import type { Activity } from './activity.model.js';
import type { ActivityStatus } from './activity-status.model.js';
import type { User } from '../../user/models/user.model.js';
import type { Transaction } from 'sequelize';
import { Op } from 'sequelize';
import { schema, workflow } from '@tailor-cms/config';
import * as eventBus from '#shared/events/bus.ts';
import forEach from 'lodash/forEach.js';
import get from 'lodash/get.js';
import mail from '#shared/mail/index.js';
import sse from '#shared/sse/index.js';

// Hook options shape used by ActivityStatus's hooks. The
// `context.user` field carries the actor so the
// notifier can compare against the assignee.
interface StatusHookOptions {
  context?: { user?: User };
  transaction?: Transaction;
}

const add = (ActivityStatus: any, Hooks: any) => {
  const { Events } = ActivityStatus;

  const mappings: Record<string, any[]> = {
    [Hooks.afterCreate]: [
      withActivity(sseUpdate, notifyAssignee, emitStatusChanged),
    ],
  };

  forEach(mappings, (hooks, type) => {
    forEach(hooks, (hook) => {
      ActivityStatus.addHook(type, Hooks.withType(type, hook));
    });
  });

  async function emitStatusChanged(
    _hookType: string,
    activity: Activity,
    status: ActivityStatus,
    { context }: StatusHookOptions = {},
  ) {
    const previousStatus = await findPreviousStatus(status);
    if (!previousStatus) return;
    const from = describeStatus(activity, previousStatus);
    const to = describeStatus(activity, status);
    if (from.id === to.id) return;
    eventBus.publish({
      type: eventBus.EventType.ActivityStatusChanged,
      repositoryId: activity.repositoryId,
      actorId: context?.user?.id ?? null,
      subject: eventBus.subjectOf.activity(activity.id),
      data: {
        id: activity.id,
        name: activity.data?.name ?? null,
        typeLabel: schema.getLevel(activity.type)?.label ?? null,
        status: to.id,
        statusLabel: to.label,
        statusColor: to.color,
        previousStatus: from.id,
        previousStatusLabel: from.label,
        assigneeId: status.assigneeId,
      },
    });
  }

  function findPreviousStatus(status: ActivityStatus) {
    return ActivityStatus.findOne({
      where: { [Op.not]: { id: status.id }, activityId: status.activityId },
      order: [['createdAt', 'DESC']],
    });
  }

  function describeStatus(activity: Activity, { status: id }: ActivityStatus) {
    const config = findStatusConfig(activity, id);
    return { id, label: config?.label ?? id, color: config?.color ?? null };
  }

  function findStatusConfig(activity: Activity, id: string) {
    const schemaId = schema.getSchemaId(activity.type);
    if (!schemaId) return null;
    const { workflowId } = schema.getSchema(schemaId);
    if (!workflowId) return null;
    const statuses = workflow.getWorkflow(workflowId)?.statuses ?? [];
    return statuses.find((it) => it.id === id) ?? null;
  }

  function sseUpdate(_hookType: string, activity: Activity) {
    sse.channel(activity.repositoryId).send(Events.Update, activity);
  }

  // Mails the new assignee when the assignee actually changes and the
  // change wasn't self-assigned. Compares against the immediately-prior
  // status row (ordered DESC by createdAt).
  async function notifyAssignee(
    _: string,
    activity: Activity,
    status: ActivityStatus,
    { context = {} as { user?: User } }: StatusHookOptions,
  ) {
    const userId = get(context, 'user.id');
    if (!status.assigneeId) return;
    const previousStatus = await findPreviousStatus(status);
    const isUnchanged = previousStatus?.assigneeId === status.assigneeId;
    const isSelfAssign = status.assigneeId === userId;
    if (isUnchanged || isSelfAssign) return;
    const assignee = await status.getAssignee();
    if (!assignee) return;
    sendEmailNotification(activity, assignee);
  }

  // The status row's `belongsTo(Activity)` is fetched on first invocation
  // so each inner hook receives the activity alongside the created status
  // row. The row is passed through directly - `activity.status` comes from
  // a nested include, so neither the defaultScope ordering nor the
  // assignee eager-load apply to it.
  function withActivity(...hooks: any[]) {
    const invokeHooks = (
      type: string,
      status: ActivityStatus,
      opts: StatusHookOptions,
    ) =>
      status.getActivity({ paranoid: false }).then((activity) => {
        if (!activity) return;
        hooks.forEach((hook) => hook(type, activity, status, opts));
      });
    return afterTransaction(invokeHooks);
  }
};

async function sendEmailNotification(activity: Activity, assignee: User) {
  const { label } = schema.getLevel(activity.type);
  const repository = await activity.getRepository();
  mail.sendAssigneeNotification(assignee.email, {
    activityId: activity.id,
    repositoryId: activity.repositoryId,
    label: label.toLowerCase(),
    name: activity.data.name,
    assigneeName: assignee.firstName || assignee.email,
    repositoryName: repository?.name,
  });
}

// `transaction.afterCommit` defers the wrapped handler until commit;
// falls back to immediate invocation when no transaction is supplied.
const afterTransaction =
  (
    method: (
      type: string,
      status: ActivityStatus,
      opts: StatusHookOptions,
    ) => unknown,
  ) =>
    (type: string, status: ActivityStatus, opts: StatusHookOptions) => {
      if (!opts.transaction) return method(type, status, opts);
      opts.transaction.afterCommit(() => {
        method(type, status, opts);
      });
    };

export default { add };
