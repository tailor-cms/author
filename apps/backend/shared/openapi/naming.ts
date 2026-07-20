// Per-operation naming derivation.
//
// Stamps every route with a stable `operationId` plus `x-tailor-slice`
// and `x-tailor-method` extensions so codegen consumers (api-client and
// any future tool) can group operations and pick method names without
// re-deriving naming conventions themselves.
//
// Slice
// -----
// Derived from the route's `group`
//
// Verb
// ----
// An action's `name?: string` (declared on `defineAction`) wins
// outright when set. Otherwise the verb is derived from method + path
// with REST conventions when the slice has a single shared root
// segment, preserving the root in the name when it fans out across
// multiple roots. Examples:
//
//   GET    /repositories                        -> list
//   POST   /repositories                        -> create
//   GET    /repositories/:id                    -> get
//   PUT    /repositories/:id                    -> update
//   PATCH  /repositories/:id                    -> update
//   DELETE /repositories/:id                    -> delete
//   POST   /repositories/:id/publish            -> publish
//   GET    /repositories/:id/clones             -> getClones
//   GET    /repositories/:id/clones/:cloneId    -> getClonesById
//
// Multi-root slice (Library spans /assets, /discover, /indexing):
//
//   POST   /discover                            -> postDiscover
//   POST   /indexing                            -> postIndexing
//   GET    /indexing/:assetId/status            -> getIndexingStatusById
//
// `operationId = <slice><PascalCase(verb)>`. On the rare collision
// (two routes resolving to the same shortened verb inside one slice),
// we fall back to the full method+path-derived name for every colliding
// entry, which is unique by construction.
import type { RouteRecord } from './registry.ts';
import { createLogger } from '#logger';

const logger = createLogger('openapi');

export interface OperationNames {
  slice: string;
  verb: string;
  operationId: string;
}

const REST_TOP_LEVEL: Record<string, { collection: string; item: string }> = {
  get: { collection: 'list', item: 'get' },
  post: { collection: 'create', item: 'create' },
  put: { collection: 'update', item: 'update' },
  patch: { collection: 'update', item: 'update' },
  delete: { collection: 'delete', item: 'delete' },
};

const camelCase = (s: string): string => s[0]!.toLowerCase() + s.slice(1);

// Tolerate kebab- and snake-cased path segments (`user-group`, `feed_item`).
const pascalCase = (s: string): string =>
  s
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join('');

export const toSliceKey = (label: string): string => {
  const parts = label.split(/[^\w]+/).filter(Boolean);
  if (!parts.length) return '_';
  const normalize = (part: string): string =>
    part === part.toUpperCase() ? part.toLowerCase() : part;
  const [head, ...rest] = parts.map(normalize);
  return camelCase(head!) + rest.map(pascalCase).join('');
};

const segmentsOf = (urlPath: string): string[] =>
  urlPath.split('/').filter(Boolean);

// Express stores params as `:foo`; OpenAPI emits them as `{foo}`
const isParam = (seg: string): boolean =>
  seg.startsWith(':') || seg.startsWith('{');

const paramName = (seg: string): string => seg.replace(/^[:{]|[}]$/g, '');

const sliceFor = (route: RouteRecord): string =>
  toSliceKey(route.group ?? route.tag ?? 'Misc');

// Returns the slice's shared root segment iff every route shares the
// same first segment. Otherwise `null`; signal that the root must be
// kept in every verb name as a disambiguator.
const sharedRootFor = (routes: readonly RouteRecord[]): string | null => {
  let shared: string | null = null;
  for (const r of routes) {
    const head = segmentsOf(r.path)[0];
    if (!head) return null;
    if (shared === null) shared = head;
    else if (shared !== head) return null;
  }
  return shared;
};

const shortVerb = (route: RouteRecord, sharedRoot: string | null): string => {
  // Explicit override (`defineAction({ name: '...' })`) wins outright.
  if (route.name) return route.name;

  // Decompose the URL:
  //   root         - first segment (the resource the slice is built on)
  //   tail         - everything after the root
  //   literalTail  - tail without params (`{repositoryId}` etc. dropped)
  //   lastIsParam  - true for `/foo/:id`-style item routes
  const segments = segmentsOf(route.path);
  const root = segments[0] ?? '';
  const tail = segments.slice(1);
  const literalTail = tail.filter((s) => !isParam(s));
  const lastIsParam = tail.length > 0 && isParam(tail[tail.length - 1]!);

  // REST shorthand path: the route targets the slice's shared top-level
  // resource (`/repositories` or `/repositories/:id`), no extra literal
  // segments. Map the HTTP method to a domain verb (`list` / `create` /
  // `get` / `update` / `delete`), picking collection vs item by whether
  // the URL ends with a param.
  if (sharedRoot && sharedRoot === root && literalTail.length === 0) {
    const verbMap = REST_TOP_LEVEL[route.method];
    if (verbMap) return lastIsParam ? verbMap.item : verbMap.collection;
    // Method outside the REST table (head/options/trace): keep the
    // method itself, suffix `ById` for item routes.
    return route.method + (lastIsParam ? 'ById' : '');
  }

  // Sub-resource (`/:id/publish`) or multi-root slice (Library spans
  // `/assets`, `/discover`, `/indexing`). Assemble:
  //   <method> <Root?> <Literal*> <ById?>
  //
  //   prefix : the root segment, preserved only when the slice spans
  //            multiple roots; for single-root slices the slice key
  //            already encodes it, so we omit to avoid duplication
  //   body   : Pascal-cased literal tail segments (`users` -> `Users`)
  //   suffix : `ById` when the URL ends with a param
  const prefix = sharedRoot ? '' : pascalCase(root);
  const body = literalTail.map(pascalCase).join('');
  const suffix = lastIsParam ? 'ById' : '';
  return route.method + prefix + body + suffix;
};

// Unique-by-construction verb derived from the full method + path; used
// as the collision fallback. Same shape build-namespace.ts used to apply.
const fullVerb = (route: RouteRecord): string => {
  let verb = route.method;
  for (const seg of segmentsOf(route.path)) {
    verb += isParam(seg) ? `By${pascalCase(paramName(seg))}` : pascalCase(seg);
  }
  return verb;
};

// `By<Param>` suffix for every param in the path. Used to disambiguate
// two routes whose `shortVerb` collided because the only structural
// difference between them is an intermediate param segment - e.g.
// `GET /indexing/status` vs `GET /indexing/:assetId/status` both short
// to `getIndexingStatus`; the second becomes `getIndexingStatusByAssetId`.
const paramSuffix = (route: RouteRecord): string =>
  segmentsOf(route.path)
    .filter(isParam)
    .map((seg) => `By${pascalCase(paramName(seg))}`)
    .join('');

const groupBySlice = (
  routes: readonly RouteRecord[],
): Array<{ slice: string; routes: RouteRecord[] }> => {
  const map = new Map<string, RouteRecord[]>();
  for (const route of routes) {
    const slice = sliceFor(route);
    const bucket = map.get(slice) ?? [];
    bucket.push(route);
    map.set(slice, bucket);
  }
  return [...map].map(([slice, sliceRoutes]) => ({
    slice,
    routes: sliceRoutes,
  }));
};

interface VerbAssignment {
  route: RouteRecord;
  verb: string;
}

// Three-stage collision resolution:
//   1. Most verbs are unique - pass through.
//   2. For colliding verbs, append a `By<Param>` suffix per param in
//      the route's path. Routes with no params keep the short name; the
//      one with params gets the suffix. Resolves the common case where
//      a literal-tail route and a param-bearing variant share a short
//      verb (e.g. `getIndexingStatus` collision above).
//   3. Anything still colliding (same path shape, e.g. two POSTs that
//      both shorten to the same word) falls back to the full method+path
//      name with a warning - rare, but worth flagging.
const resolveCollisions = (
  slice: string,
  assignments: VerbAssignment[],
): VerbAssignment[] => {
  // Returns the set of verbs that appear more than once across `assignments`.
  const collidingVerbs = (assignments: VerbAssignment[]): Set<string> => {
    const seen = new Set<string>();
    const colliding = new Set<string>();
    for (const { verb } of assignments) {
      if (seen.has(verb)) colliding.add(verb);
      else seen.add(verb);
    }
    return colliding;
  };

  // Stage 1 → 2: for verbs shared by multiple routes, append
  // `By<Param>` to routes that have params. Param-less routes keep the
  // short name; siblings become e.g. `getIndexingStatusByAssetId`.
  const sharedShortVerbs = collidingVerbs(assignments);
  const disambiguated = assignments.map((a) => {
    if (!sharedShortVerbs.has(a.verb)) return a;
    return { route: a.route, verb: a.verb + paramSuffix(a.route) };
  });
  // Stage 3: anything still colliding (same path shape - e.g. two POSTs
  // that shorten identically) falls back to the unique-by-construction
  // full path-derived name, with a warning.
  const unresolvable = collidingVerbs(disambiguated);
  return disambiguated.map((a) => {
    if (!unresolvable.has(a.verb)) return a;
    logger.warn(
      `Unresolvable collision in slice "${slice}" on verb `
      + `"${a.verb}"; falling back to full path-derived name.`,
    );
    return { route: a.route, verb: fullVerb(a.route) };
  });
};

export const deriveOperationNames = (
  routes: readonly RouteRecord[],
): Map<RouteRecord, OperationNames> => {
  const namesByRoute = new Map<RouteRecord, OperationNames>();
  for (const { slice, routes: sliceRoutes } of groupBySlice(routes)) {
    const sharedRoot = sharedRootFor(sliceRoutes);
    const shortAssignments: VerbAssignment[] = sliceRoutes.map((route) => ({
      route,
      verb: shortVerb(route, sharedRoot),
    }));
    for (const { route, verb } of resolveCollisions(slice, shortAssignments)) {
      namesByRoute.set(route, {
        slice,
        verb,
        operationId: `${slice}${pascalCase(verb)}`,
      });
    }
  }
  return namesByRoute;
};
