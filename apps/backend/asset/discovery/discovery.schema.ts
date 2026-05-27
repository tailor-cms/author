// Wire-shape contracts for the Discovery sub-router
import {
  CONTENT_TYPES,
  ContentFilter,
  ContentType,
} from '@tailor-cms/interfaces/discovery.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Mirror of the runtime DiscoveryResult interface; one row per search hit
// returned across discovery providers (Serper / Unsplash / LLM fallback).
export const DiscoveryResult = z
  .object({
    type: z.enum(ContentType).describe('Discovered content classification.'),
    url: z.url().describe('Canonical URL of the result.'),
    title: z.string().describe('Result title.'),
    description: z
      .string()
      .optional()
      .describe('Long-form description from the provider.'),
    snippet: z.string().describe('Short snippet / abstract.'),
    source: z.string().describe(oneLine`
      Search provider that returned the result
      (e.g. google, unsplash).
    `),
    thumbnailUrl: z.string().optional().describe('Preview thumbnail URL.'),
    downloadUrl: z
      .string()
      .optional()
      .describe('Direct binary URL for downloadable content.'),
    tags: z.array(z.string()).optional().describe('Provider-supplied tags.'),
    author: z.string().optional().describe('Content author when known.'),
    license: z.string().optional().describe('License identifier when known.'),
    altText: z.string().optional().describe('Alt text for image results.'),
  })
  .meta({ id: 'DiscoveryResult' })
  .describe('A single search hit returned by the discovery service.');

export type DiscoveryResult = z.infer<typeof DiscoveryResult>;

// POST /repositories/:repositoryId/assets/discover
export const DiscoverInput = z
  .object({
    query: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .describe('Free-text search query.'),
    contentFilter: z.enum([ContentFilter.All, ...CONTENT_TYPES]).optional()
      .describe(oneLine`
        Restrict results to a content category;
        one of ALL, ${CONTENT_TYPES.join(', ')}.
      `),
    count: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of results to return (1..100).'),
  })
  .describe('Search payload for cross-provider asset discovery.');

export type DiscoverInput = z.infer<typeof DiscoverInput>;
