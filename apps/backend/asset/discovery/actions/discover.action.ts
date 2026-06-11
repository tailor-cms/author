import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../discovery.schema.ts';
import * as service from '../discovery.service.ts';
import { z } from 'zod';

// POST /repositories/:repositoryId/assets/discover
// Cross-provider search (Serper + Unsplash; LLM web_search as fallback).
// Budget allocation and dedup happen in the service; this action is a
// thin wire boundary.
export default defineAction({
  name: 'discover',
  body: schemas.DiscoverInput,
  openapi: {
    authenticated: true,
    summary: 'Search the web for repository relevant resources',
    description: oneLine`
      Routes the query across Serper endpoints (web / image / news /
      video / scholar) and Unsplash based on the contentFilter; falls back
      to OpenAI web_search when Serper is unavailable or quota exceeded.
    `,
    responses: {
      200: {
        description: 'Deduped & trimmed search results from the providers.',
        schema: dataEnvelope(z.array(schemas.DiscoveryResult)),
      },
      503: { description: 'Discovery sub-service is disabled by config.' },
    },
  },
  async handler({ body, req }) {
    return service.search(
      body.query,
      req.repository!,
      body.contentFilter as any,
      body.count,
    );
  },
});
