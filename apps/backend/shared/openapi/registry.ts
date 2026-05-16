// Each slice's action mounter pushes `RouteRecord` entries into the shared
// `routes` array as it wires routes onto an Express router. The emitter
// walks the same array at boot time to produce a single OpenAPI document.
import type { ZodType } from 'zod';

export type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

// OpenAPI metadata declared on an action. Path + method are recorded at
// route-registration time, so action files do not have to repeat them.
export interface OpenApiSpec {
  summary?: string;
  description?: string;
  responses?: Record<
    number,
    { description?: string; schema?: ZodType } | ZodType
  >;
  // Documentation-only flag. The actual auth gate lives in route middleware.
  authenticated?: boolean;
}

// Captures everything the emitter needs to render one operation. Slices
// register one of these per route via `appendRoute`. `tag` is the
// sidebar grouping label (one per feature slice); the emitter folds it
// into `operation.tags[]` so Scalar can cluster routes by feature.
export interface RouteRecord {
  method: HttpMethod;
  path: string;
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
  openapi?: OpenApiSpec;
  tag?: string;
}

const routes: RouteRecord[] = [];

export function appendRoute(record: RouteRecord): void {
  routes.push(record);
}

export function getRegisteredRoutes(): readonly RouteRecord[] {
  return routes;
}
