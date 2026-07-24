// Wire shape for the seed-comment endpoint.
import { z } from 'zod';
import { Email, IntParam } from '#shared/request/schemas.ts';

export const CommentInput = z
  .object({
    repositoryId: IntParam().describe('Repository the comment belongs to.'),
    activityId: IntParam().describe('Activity the comment belongs to.'),
    contentElementId: IntParam()
      .nullable()
      .optional()
      .describe('Optional content element id; null if activity-level comment.'),
    content: z.string().min(1).max(2000).describe('Comment body.'),
    authorEmail: Email()
      .nullable()
      .optional()
      .describe('Email of an existing user to attribute the comment to.'),
  })
  .describe('Required and optional fields for seeding a comment.');

export type CommentInput = z.infer<typeof CommentInput>;
