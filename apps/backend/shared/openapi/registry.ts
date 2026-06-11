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
// register one of these per route via `appendRoute`.
//   - `tag`        : the canonical (globally unique) label used in
//                    `operation.tags[]` and as the key of the
//                    components.tags entry. When the mounter is given
//                    both a tag and a group, this is auto-prefixed to
//                    `<group> / <tag>` so two slices can both declare
//                    short tags like `CRUD` without colliding.
//   - `group`      : optional thematic bucket; multiple tags can share
//                    one. The emitter places the tag into an
//                    `x-tagGroups` entry named after the group (Scalar /
//                    Redoc render this as a sidebar section). Tags
//                    without a group fall back to the slash-convention
//                    rules.
//   - `displayTag` : the short label the mounter was originally given
//                    (`CRUD`, `Lifecycle`, …). Emitted as
//                    `x-displayName` on the tag definition so Scalar
//                    keeps the short label in the sidebar even when
//                    `tag` has been disambiguated above.
export interface RouteRecord {
  method: HttpMethod;
  path: string;
  // Optional verb override. When set, naming.ts uses this verbatim as
  // the route's `x-tailor-method`.
  // the operation's intent.
  name?: string;
  body?: ZodType;
  // When set, the route's wire body is `multipart/form-data` rather
  // than `application/json`.
  multipart?: ZodType;
  query?: ZodType;
  params?: ZodType;
  openapi?: OpenApiSpec;
  tag?: string;
  displayTag?: string;
  group?: string;
  // Per-mounter creation index, set by `createActionMounter`. The
  // emitter uses this to order tags in the OpenAPI doc by mounter
  // declaration order rather than route-registration order — so a
  // literal-route-before-param ordering constraint (e.g. `/link`
  // before `/:activityId`) doesn't leak into the docs sidebar.
  mounterOrder?: number;
}

const routes: RouteRecord[] = [];

export function appendRoute(record: RouteRecord): void {
  routes.push(record);
}

export function getRegisteredRoutes(): readonly RouteRecord[] {
  return routes;
}
