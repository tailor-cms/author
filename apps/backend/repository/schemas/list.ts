// Wire shape for the repositories listing endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  IntArrayFromForm,
  IntParam,
  Paginated,
  Pagination,
  QueryBoolean,
  Sort,
  StringArrayFromQuery,
} from '#shared/request/schemas.ts';
import { Revision } from '#app/revision/schemas/entity.ts';

import { Repository } from './entity.ts';

const SORT_COLUMNS = ['name', 'createdAt', 'updatedAt', 'description'] as const;

export const ListFilter = z
  .object({
    search: z
      .string()
      .trim()
      .max(250)
      .optional()
      .describe('Substring match against repository name (iLike).'),
    name: z
      .string()
      .trim()
      .max(250)
      .optional()
      .describe('Exact match against repository name.'),
    userGroupId: IntParam()
      .optional()
      .describe('Filter to repositories shared with a user group.'),
    pinned: QueryBoolean.optional().describe(oneLine`
      Pinned filter for the current user's catalog view.
    `),
    schemas: StringArrayFromQuery().describe(oneLine`
      Restrict to one or more schema ids. Default is unfiltered (all schemas).
    `),
    tagIds: IntArrayFromForm().describe(oneLine`
      Restrict to repositories tagged with any of these tag ids.
    `),
    compatibleWith: z.string().trim().max(64).optional().describe(oneLine`
      Schema id used to find repos whose schema is link-compatible via
      the \`mapsTo\` cross-schema rules.
    `),
    paranoid: QueryBoolean.optional().describe(oneLine`
      Set false to include soft-deleted repositories.
    `),
    ...Pagination(),
    ...Sort(SORT_COLUMNS),
  })
  .describe('Filters, pagination, and sort for listing repositories.');

export type ListFilter = z.infer<typeof ListFilter>;

// A repository row in the list response.
export const RepositoryListItem = Repository.extend({
  revisions: z.array(Revision).optional().describe(oneLine`
    Last-revision pointers joined in by the list endpoint (one row per
    author of the most recent revision).
  `),
})
  .meta({ id: 'RepositoryListItem' })
  .describe('Repository row in the catalog list response.');

export type RepositoryListItem = z.infer<typeof RepositoryListItem>;

// Top-level response envelope for the list endpoint
export const ListResult = Paginated(RepositoryListItem, 'RepositoryListResult')
  .describe('Paginated repository list response.');

export type ListResult = z.infer<typeof ListResult>;
