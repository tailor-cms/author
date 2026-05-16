// Comment lifecycle hooks: SSE broadcasts + mail notifications.
// SSE: every Create / Update / Delete is broadcast on the comment's
// repository channel so other collaborators see the thread in
// real time. Mail: Create + Update notify the repository's
// collaborators (excluding the author).
import type { ModelStatic } from 'sequelize';
import map from 'lodash/map.js';
import pick from 'lodash/pick.js';
import { schema } from '@tailor-cms/config';
import without from 'lodash/without.js';
import sse from '#shared/sse/index.js';
import mail from '#shared/mail/index.js';
import type { Comment } from './comment.model.js';
import type { Repository } from '../../repository/models/repository.model.js';
import type { RepositoryUser } from '../../repository/models/repository-user.model.js';
import type { User } from '../../user/models/user.model.js';

// Subset of the `db` bag this slice actually uses. Repository / User /
// RepositoryUser have their own .d.ts and get precise types; Activity
// and ContentElement don't yet, so they fall back to the generic
// `ModelStatic` shape.
interface ModelsBag {
  Repository: ModelStatic<Repository>;
  RepositoryUser: ModelStatic<RepositoryUser>;
  User: ModelStatic<User>;
  Activity: ModelStatic<any>;
  ContentElement: ModelStatic<any>;
}

function add(Comment: any, Hooks: any, db: ModelsBag) {
  const { Events } = Comment;
  const { Repository, RepositoryUser, Activity, ContentElement, User } = db;

  const includeElement = {
    model: ContentElement,
    as: 'contentElement',
    attributes: ['uid', 'type'],
  };

  Comment.addHook(Hooks.afterCreate, async (comment: Comment) => {
    const includeAuthor = {
      model: User,
      as: 'author',
      attributes: [
        'id',
        'email',
        'firstName',
        'lastName',
        'fullName',
        'label',
        'imgUrl',
      ],
    };
    const include = [includeAuthor, includeElement];
    const { author, contentElement } = (await comment.reload({
      include,
    })) as any;
    sse
      .channel(comment.repositoryId)
      .send(Events.Create, { ...comment.toJSON(), author, contentElement });
    sendEmailNotification(comment);
  });

  Comment.addHook(Hooks.afterUpdate, (comment: Comment) => {
    sse.channel(comment.repositoryId).send(Events.Update, comment);
    sendEmailNotification(comment, { isCreate: false });
  });

  Comment.addHook(Hooks.afterBulkUpdate, async ({ where }: { where: any }) => {
    const comments: Comment[] = await Comment.findAll({
      where,
      paranoid: false,
    });
    comments.forEach((comment) => {
      sse.channel(comment.repositoryId).send(Events.Update, comment);
    });
  });

  Comment.addHook(Hooks.afterDestroy, (comment: Comment) => {
    Comment.findByPk(comment.id, { paranoid: false }).then(
      (comment: Comment) => {
        sse.channel(comment.repositoryId).send(Events.Delete, comment);
      },
    );
  });

  async function sendEmailNotification(
    comment: Comment,
    { isCreate = true } = {},
  ) {
    await comment.reload({
      include: [
        {
          model: Repository,
          include: [{ model: RepositoryUser, include: { model: User } }],
        },
        {
          model: Activity,
          attributes: ['id', 'type', 'data'],
          paranoid: false,
        },
        { model: User, as: 'author' },
        includeElement,
      ],
    });
    const { author, repository, activity, contentElement } = comment as any;
    const options = {
      offset: 1,
      limit: 3,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author' }],
    };
    const previousComments = isCreate
      ? await activity.getComments(options)
      : [];
    const data = {
      repositoryId: repository.id,
      repositoryName: repository.name,
      activityId: activity.id,
      elementUid: contentElement && contentElement.uid,
      activityLabel: schema.getLevel(activity.type).label,
      topic: activity.data.name,
      author: author.profile,
      previousComments,
      action: isCreate ? 'left' : 'updated',
      ...pick(comment, ['id', 'content', 'createdAt']),
    };
    const collaborators = map(repository.repositoryUsers, 'user.email');
    const recipients = without(collaborators, author.email);
    if (recipients.length) mail.sendCommentNotification(recipients, data);
  }
}

export default { add };
