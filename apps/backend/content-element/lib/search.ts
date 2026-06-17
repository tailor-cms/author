// Full-text search internals for the ContentElement slice: tsquery
// building, the `ts_headline` snippet select, and outline-ancestor
// decoration. Kept out of the service so its orchestration stays
// readable, and so the one unavoidable raw fragment (the JSONB-flattening
// subquery, which carries no user input) is quarantined in one place.
import { cast, fn, literal } from 'sequelize';
import db from '#shared/database/index.js';

import type { ContentElement } from '../models/content-element.model.js';

const { Activity } = db;

// Builds a prefix-matching tsquery from the user's term: parse it with
// `websearch_to_tsquery` (quoted phrases, `-exclusion`), then append `:*`
// to every lexeme so "mov" matches "move". Assembled with `fn`/`cast` so
// the term is escaped by Sequelize as a bound literal - never string
// interpolated - which keeps it injection-safe.
export function prefixTsQuery(term: string): ReturnType<typeof fn> {
  const websearch = cast(fn('websearch_to_tsquery', 'english', term), 'text');
  const prefixed = fn(
    'regexp_replace',
    websearch,
    '\'([^\']+)\'', // each single-quoted lexeme in the tsquery text...
    '\'\\1\':*', // ...gets a `:*` prefix flag (\1 is a regex backreference)
    'g',
  );
  return fn('to_tsquery', 'english', prefixed);
}

// Builds the `searchSnippet` select attribute: flattens every string
// value inside `data` (the same set the search vector indexes), strips
// HTML tags, and lets `ts_headline` pick the best-matching fragments.
// Matches are wrapped in `⟪`/`⟫` markers the FE swaps for real markup
// after escaping; the glyphs are chosen to never occur in authored
// content. The flattening subquery carries no user input, so it stays a
// `literal`; the term rides in via `tsQuery`, already escaped.
export function snippetAttribute(
  tsQuery: ReturnType<typeof fn>,
): [ReturnType<typeof fn>, string] {
  const flattened = `(
    SELECT coalesce(string_agg(s.value #>> '{}', ' '), '')
    FROM jsonb_path_query(data, 'strict $.** ? (@.type() == "string")')
      AS s(value)
  )`;
  // Strip HTML tags before highlighting; replaced with a space
  // so words split only by a tag stay separate words.
  const source = literal(`regexp_replace(${flattened}, '<[^>]*>', ' ', 'g')`);
  // ts_headline formatting: up to 2 fragments of 6-18 words joined by an
  // ellipsis, with matches wrapped in the `⟪`/`⟫` sentinels.
  const options = [
    'StartSel=⟪, StopSel=⟫, MaxWords=18, MinWords=6',
    'MaxFragments=2, FragmentDelimiter=" … "',
  ].join(', ');
  // Sequelize aliased attribute: `<expr> AS "searchSnippet"`.
  return [fn('ts_headline', 'english', source, tsQuery, options), 'searchSnippet'];
}

// Maps the elements container activity ids to their closest
// outline-level ancestor id.
export async function resolveOutlineIds(
  elements: ContentElement[],
): Promise<Map<number, number>> {
  const containerIds = [...new Set(elements.map((it) => it.activityId))];
  const containers = await Activity.findAll({
    where: { id: containerIds },
    paranoid: false,
  });
  const entries = await Promise.all(
    containers.map(async (it: any) => {
      const outline = await it.getFirstOutlineItem();
      return [it.id, outline?.id] as [number, number];
    }),
  );
  return new Map(entries.filter(([, outlineId]) => outlineId));
}
