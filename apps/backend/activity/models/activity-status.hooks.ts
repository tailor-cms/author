// ActivityStatus lifecycle hooks: SSE broadcast on create + email
// notification when the assignee changes.
import type { Transaction } from 'sequelize';
import forEach from 'lodash/forEach.js';
import get from 'lodash/get.js';
import { Op } from 'sequelize';
import { schema } from '@tailor-cms/config';
import mail from '#shared/mail/index.js';
import sse from '#shared/sse/index.js';
import type { Activity } from './activity.model.js';
import type { ActivityStatus } from './activity-status.model.js';
import type { User } from '../../user/models/user.model.js';

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
    [Hooks.afterCreate]: [withActivity(sseUpdate, notifyAssignee)],
  };

  forEach(mappings, (hooks, type) => {
    forEach(hooks, (hook) => {
      ActivityStatus.addHook(type, Hooks.withType(type, hook));
    });
  });

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
    const previousStatus = await ActivityStatus.findOne({
      where: {
        [Op.not]: { id: status.id },
        activityId: status.activityId,
      },
      order: [['createdAt', 'DESC']],
    });
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
