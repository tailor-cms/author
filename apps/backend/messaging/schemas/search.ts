import {
  IntParam,
  OneOrMany,
  Paginated,
  Pagination,
  ShortText,
} from '#shared/request/schemas.ts';
import { Message, ThreadRef } from './entity.ts';
import { ReferenceType } from '@tailor-cms/utils';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// `type:id`
const REFERENCE = new RegExp(
  `^(${Object.values(ReferenceType).join('|')}):[0-9a-zA-Z.-]+$`,
);
const Reference = z
  .string()
  .max(120)
  .regex(REFERENCE, 'Expected `type:id`, e.g. `activity:12`');

export const SearchFilter = z
  .object({
    q: ShortText(1, 200).optional().describe(oneLine`
      Free-text query over message bodies (Postgres \`websearch\`
      syntax: quoted phrases, \`-exclusions\`).
    `),
    mentions: OneOrMany(IntParam())
      .optional()
      .describe('User ids the message must mention.'),
    references: OneOrMany(Reference)
      .optional()
      .describe(oneLine`
        Entities the message must reference, as \`type:id\` (e.g.
        \`activity:12\`, \`asset:88\`).
      `),
    ...Pagination(),
  })
  .describe(oneLine`
    Filters combine, so every one given has to match. Nothing given
    matches nothing.
  `);

export type SearchFilter = z.infer<typeof SearchFilter>;

export const SearchHit = Message.extend({
  thread: ThreadRef.nullable().optional(),
})
  .meta({ id: 'MessageSearchHit' })
  .describe('A message matching a search, with its thread.');

export type SearchHit = z.infer<typeof SearchHit>;

export const SearchResult = Paginated(
  SearchHit,
  'MessageSearchResult',
).describe('A page of message search results.');

export type SearchResult = z.infer<typeof SearchResult>;
