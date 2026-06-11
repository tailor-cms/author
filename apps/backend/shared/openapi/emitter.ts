// OpenAPI 3.1 document emitter.
//
// Walks the shared route registry, converts each action's Zod schemas to
// JSON Schema via `z.toJSONSchema`, and assembles a single OpenAPI
// document. Exposed at `/openapi.json` so FE codegen tools can consume it.
//
// Named entities (any Zod schema declared with `.meta({ id: 'Name' })`)
// are promoted to `components.schemas` and referenced via `$ref` from
// every operation that uses them. This is what makes Scalar render
// "Tag[]" instead of "object[]", lets users navigate the Schemas
// sidebar, and keeps the document compact when entities are reused.
import { z, type ZodType } from 'zod';
import { fileURLToPath } from 'node:url';
import { packageDirectory } from 'package-directory';
import fs from 'node:fs/promises';
import path from 'node:path';

import { deriveOperationNames, type OperationNames } from './naming.ts';
import { getRegisteredRoutes, type RouteRecord } from './registry.ts';
import { createLogger } from '#logger';
import config from '#config';

const logger = createLogger('openapi');

const APP_DIR = (await packageDirectory({
  cwd: path.dirname(fileURLToPath(import.meta.url)),
}))!;

export const OPENAPI_SPEC_PATH = path.join(APP_DIR, 'openapi.json');

// Express `:param` -> OpenAPI `{param}`.
function toOpenApiPath(p: string): string {
  return p.replace(/:(\w+)/g, '{$1}');
}

// Document-scoped components registry. Populated as a side effect of
// `schemaJson` while walking routes; assembled into the final document
// by `buildOpenApiDocument` below.
const components = new Map<string, unknown>();

// Rewrites Zod's default `#/$defs/<id>` refs to OpenAPI's
// `#/components/schemas/<id>` convention so Scalar resolves them, and
// drops the strict `pattern` Zod adds to primitives that already declare
// a `format` (date-time, uuid, ...).
function rewriteRefs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(rewriteRefs);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.$ref === 'string') {
      obj.$ref = obj.$ref.replace('#/$defs/', '#/components/schemas/');
    }
    if (
      typeof obj.format === 'string' &&
      typeof obj.pattern === 'string'
    ) {
      delete obj.pattern;
    }
    for (const key of Object.keys(obj)) {
      obj[key] = rewriteRefs(obj[key]);
    }
  }
  return value;
}

// Pulls any `$defs` entries Zod emitted for nested named schemas into
// the shared components map and strips `$defs` from the local fragment
// so it doesn't leak into the operation body.
function liftDefs(json: any): any {
  if (json && typeof json === 'object' && json.$defs) {
    for (const [id, def] of Object.entries(json.$defs)) {
      if (!components.has(id)) {
        components.set(id, rewriteRefs(def));
      }
    }
    delete json.$defs;
  }
  return json;
}

// Render a Zod schema to a JSON Schema fragment with named entities
// promoted to components. `undefined` when the route doesn't declare
// that slot.
function schemaJson(s: ZodType | undefined): unknown {
  if (!s) return undefined;
  const json: any = z.toJSONSchema(s, { unrepresentable: 'any' });
  return rewriteRefs(liftDefs(json));
}

// Build OpenAPI `parameters[]` entries from a top-level Zod object's
// fields. Each property becomes one parameter in the given `slot`
// (`path` or `query`) with its required/optional state preserved.
function paramsFor(schema: ZodType | undefined, slot: 'path' | 'query') {
  if (!schema) return [];
  const json: any = liftDefs(
    z.toJSONSchema(schema, { unrepresentable: 'any' }),
  );
  if (json.type !== 'object' || !json.properties) return [];
  const required = new Set<string>(json.required ?? []);
  return Object.entries<any>(json.properties).map(([name, def]) => ({
    name,
    in: slot,
    required: required.has(name),
    schema: rewriteRefs(def),
  }));
}

// Assemble the full OpenAPI operation object for one route record:
// summary, parameters, requestBody, responses, security. The
// slice-level tag from the mounter goes verbatim into `operation.tags`
// so Scalar groups routes by feature; routes without a tag fall back
// to "Misc" so they still land under a labelled sidebar section.
//
// The `names` map is precomputed in `buildPaths` so that verb
// derivation can see every route in the slice
// (needed to decide whether REST shorthand applies and to resolve collisions).
function operationFor(route: RouteRecord, names: OperationNames | undefined) {
  const op: any = {
    tags: [route.tag ?? 'Misc'],
    ...(names && {
      'operationId': names.operationId,
      'x-tailor-slice': names.slice,
      'x-tailor-method': names.verb,
    }),
    summary: route.openapi?.summary,
    description: route.openapi?.description,
    parameters: [
      ...paramsFor(route.params, 'path'),
      ...paramsFor(route.query, 'query'),
    ],
    responses: {} as Record<string, any>,
  };
  if (route.multipart) {
    op.requestBody = {
      required: true,
      content: {
        'multipart/form-data': { schema: schemaJson(route.multipart) },
      },
    };
  } else if (route.body) {
    op.requestBody = {
      required: true,
      content: { 'application/json': { schema: schemaJson(route.body) } },
    };
  }
  const responses = route.openapi?.responses ?? {};
  for (const [code, value] of Object.entries(responses)) {
    const entry =
      value instanceof z.ZodType ? { description: '', schema: value } : value;
    op.responses[code] = {
      description: entry.description ?? '',
      ...(entry.schema && {
        content: { 'application/json': { schema: schemaJson(entry.schema) } },
      }),
    };
  }
  if (Object.keys(op.responses).length === 0) {
    op.responses['200'] = { description: 'Success' };
  }
  if (route.openapi?.authenticated) {
    op.security = [{ bearerAuth: [] }];
  }
  return op;
}

// Fold every registered route into the OpenAPI `paths` object in
// registration order.
export function buildPaths() {
  const routes = getRegisteredRoutes();
  const names = deriveOperationNames(routes);
  const paths: Record<string, Record<string, any>> = {};
  for (const route of routes) {
    const apiPath = toOpenApiPath(route.path);
    paths[apiPath] = paths[apiPath] ?? {};
    paths[apiPath][route.method] = operationFor(route, names.get(route));
  }
  return paths;
}

interface TagInfo {
  tag: string;
  // Bucket key for x-tagGroups. Explicit theme from the mount spec
  // when set; otherwise the tag itself.
  group: string;
  // Short label rendered in the sidebar via `x-displayName`. Populated
  // when the mounter disambiguated a generic tag (`CRUD`, `Lifecycle`,
  // …) by prefixing the group; omitted when `tag` is already the
  // intended display name.
  displayTag?: string;
  // Lowest mounter creation index seen for this tag — drives the
  // sidebar order so a tag declared earlier (via `createActionMounter`)
  // always sorts before a tag declared later, regardless of when their
  // routes were actually registered.
  order: number;
}

// Distinct tags from the route registry, sorted by mounter declaration
// order.
function collectTagInfo(): TagInfo[] {
  const seen = new Map<string, TagInfo>();
  for (const route of getRegisteredRoutes()) {
    const tag = route.tag ?? 'Misc';
    const order = route.mounterOrder ?? Number.MAX_SAFE_INTEGER;
    const existing = seen.get(tag);
    if (existing) {
      if (order < existing.order) existing.order = order;
      continue;
    }
    seen.set(tag, {
      tag,
      group: route.group ?? tag,
      ...(route.displayTag && { displayTag: route.displayTag }),
      order,
    });
  }
  return Array.from(seen.values()).sort((a, b) => a.order - b.order);
}

/**
 * `x-tagGroups` (Scalar / Redoc extension). Slices without an
 * explicit `group` get a singleton bucket named after themselves;
 * slices sharing a `group: 'X'` co-locate under the "X" header.
 * Order within a bucket is registration order.
 */
function buildTagGroups(tagInfo: TagInfo[]) {
  const groups = new Map<string, string[]>();
  for (const { tag, group } of tagInfo) {
    const bucket = groups.get(group) ?? [];
    if (!bucket.includes(tag)) bucket.push(tag);
    groups.set(group, bucket);
  }
  return Array.from(groups, ([name, tags]) => ({ name, tags }));
}

export async function writeOpenApiSnapshot(): Promise<void> {
  if (config.isProduction) return;
  try {
    const doc = buildOpenApiDocument();
    await fs.writeFile(OPENAPI_SPEC_PATH, JSON.stringify(doc, null, 2));
    logger.info(`OpenAPI spec written to ${OPENAPI_SPEC_PATH}`);
  } catch (err) {
    logger.warn({ err }, 'Failed to write OpenAPI spec to disk');
  }
}

// Assemble the full OpenAPI 3.1 document. Paths are built first so the
// `components.schemas` map is populated by the time we serialise it.
export function buildOpenApiDocument() {
  components.clear();
  const paths = buildPaths();
  const tagInfo = collectTagInfo();
  return {
    'openapi': '3.1.0',
    'info': {
      title: 'Tailor CMS API',
      version: '1.0.0',
    },
    // API is served from `/api; prefix
    'servers': [{ url: '/api' }],
    'tags': tagInfo.map(({ tag, displayTag }) => ({
      name: tag,
      ...(displayTag && { 'x-displayName': displayTag }),
    })),
    'x-tagGroups': buildTagGroups(tagInfo),
    'components': {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: Object.fromEntries(components.entries()),
    },
    'paths': paths,
  };
}
