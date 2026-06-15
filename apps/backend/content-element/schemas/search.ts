// Wire shape for the content-elements search.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Int,
  Paginated,
  Pagination,
  Sort,
  StringArrayFromQuery,
} from '#shared/request/schemas.ts';
import { ContentElement } from './entity.ts';

export const SearchFilter = z
  .object({
    search: z
      .string()
      .trim()
      .min(1)
      .max(250)
      .refine(
        (it) => !it.includes(String.fromCharCode(0)),
        'Must not contain null bytes',
      )
      .optional()
      .describe(oneLine`
        Full-text query matched against every string value inside the
        element's \`data\` JSONB (via the generated \`search_vector\`
        column). Terms match by prefix (typing \`mov\` matches \`move\`) and
        support quoted phrases and \`-exclusion\` through
        \`websearch_to_tsquery\`. When present and no explicit sort is
        requested, results are ordered by relevance.
    `),
    types: StringArrayFromQuery().describe(oneLine`
      Restrict to the provided element type ids (e.g. \`TIPTAP_HTML\`,
      \`MULTIPLE_CHOICE\`).
    `),
    ...Pagination(),
    ...Sort(['updatedAt', 'createdAt'] as const),
  })
  .describe(
    'Full-text search, filters, pagination, and sort for content elements.',
  );

export type SearchFilter = z.infer<typeof SearchFilter>;

export const SearchItem = ContentElement.extend({
  outlineActivityId: Int().nullable().describe(oneLine`
    Closest outline-level ancestor of the element's container; used by
    the FE for context display and editor deep-linking.
  `),
  searchSnippet: z.string().nullable().optional().describe(oneLine`
    Best-matching text fragments for the search term, with matches
    wrapped in \`⟪\`/\`⟫\` markers (\`ts_headline\`); present only when
    a \`search\` term was provided.
  `),
}).meta({ id: 'ContentElementSearchItem' });

export type SearchItem = z.infer<typeof SearchItem>;

export const SearchResult = Paginated(SearchItem, 'ContentElementSearchResult');

export type SearchResult = z.infer<typeof SearchResult>;
