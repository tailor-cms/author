// Wire shapes for the revision-listing endpoint.
import { IntParam, Pagination, Sort, UInt } from '#shared/request/schemas.ts';
import { Entity } from '@tailor-cms/interfaces/revision';
import { oneLine } from 'common-tags';
import { Revision } from './entity.ts';
import { z } from 'zod';

export const ListFilter = z
  .object({
    entity: z.enum(Entity).optional().describe(oneLine`
      Restrict to one entity kind. When set, \`entityId\` is required
      so the result is scoped.
    `),
    entityId: IntParam()
      .optional()
      .describe('Entity id; matched against the JSONB `state.id` field.'),
    ...Pagination(),
    ...Sort(),
  })
  .refine((q) => !q.entity || q.entityId !== undefined, {
    message: '`entityId` is required when `entity` is set',
    path: ['entityId'],
  })
  .describe('Pagination and optional entity scope for listing revisions.');

export type ListFilter = z.infer<typeof ListFilter>;

export const ListResult = z
  .object({
    items: z.array(Revision).describe('Page of revisions.'),
    total: UInt().describe('Total revisions matching the filter.'),
  })
  .meta({ id: 'RevisionListResult' })
  .describe('Paginated revision list response.');

export type ListResult = z.infer<typeof ListResult>;
