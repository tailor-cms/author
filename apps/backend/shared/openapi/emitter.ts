// OpenAPI 3.1 document emitter.
//
// Walks the shared route registry, converts each action's Zod schemas to
// JSON Schema via `z.toJSONSchema`, and assembles a single OpenAPI
// document. Exposed at `/openapi.json` so FE codegen tools can consume it.
import { z, type ZodType } from 'zod';
import { getRegisteredRoutes, type RouteRecord } from './registry.ts';

// Express `:param` -> OpenAPI `{param}`.
function toOpenApiPath(p: string): string {
  return p.replace(/:(\w+)/g, '{$1}');
}

// Render a Zod schema to a JSON Schema fragment; `undefined` when the
// route doesn't declare that slot.
function schemaJson(s: ZodType | undefined): unknown {
  if (!s) return undefined;
  return z.toJSONSchema(s, { unrepresentable: 'any' });
}

// Build OpenAPI `parameters[]` entries from a top-level Zod object's
// fields. Each property becomes one parameter in the given `slot`
// (`path` or `query`) with its required/optional state preserved.
function paramsFor(schema: ZodType | undefined, slot: 'path' | 'query') {
  if (!schema) return [];
  const json: any = z.toJSONSchema(schema, { unrepresentable: 'any' });
  if (json.type !== 'object' || !json.properties) return [];
  const required = new Set<string>(json.required ?? []);
  return Object.entries<any>(json.properties).map(([name, def]) => ({
    name,
    in: slot,
    required: required.has(name),
    schema: def,
  }));
}

// Assemble the full OpenAPI operation object for one route record:
// summary, parameters, requestBody, responses, security.
function operationFor(route: RouteRecord) {
  const op: any = {
    summary: route.openapi?.summary,
    description: route.openapi?.description,
    parameters: [
      ...paramsFor(route.params, 'path'),
      ...paramsFor(route.query, 'query'),
    ],
    responses: {} as Record<string, any>,
  };
  if (route.body) {
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
  const paths: Record<string, Record<string, any>> = {};
  for (const route of getRegisteredRoutes()) {
    const apiPath = toOpenApiPath(route.path);
    paths[apiPath] = paths[apiPath] ?? {};
    paths[apiPath][route.method] = operationFor(route);
  }
  return paths;
}

// Assemble the full OpenAPI 3.1 document.
export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Tailor CMS API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    paths: buildPaths(),
  };
}
