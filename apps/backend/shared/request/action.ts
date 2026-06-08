// Cross-slice action framework helper.
//
// `defineAction` declares an endpoint's input schemas (Zod), optional
// OpenAPI metadata, and a typed handler in a single value.
// `createActionMounter` wires those actions onto an Express router AND
// pushes the route metadata into the shared OpenAPI registry. Zod schemas
// are the single source of truth for validation, the inferred handler
// types, and the generated spec.
import type {
  RequestHandler,
  Response,
  Router,
  Request as ExpressRequest,
} from 'express';
import { StatusCodes } from 'http-status-codes';
import type { z, ZodType } from 'zod';

import {
  appendRoute,
  type HttpMethod,
  type OpenApiSpec,
} from '#shared/openapi/index.ts';
import type { Activity } from '../../activity/models/activity.model.js';
import type { AgentSession } from '../ai/agent/session/index.ts';
import type { Asset } from '../../asset/models/asset.model.js';
import type { Comment } from '../../comment/models/comment.model.js';
import type { ContentElement }
  from '../../content-element/models/content-element.model.js';
import type { Repository } from '../../repository/models/repository.model.js';
import type { Revision } from '../../revision/models/revision.model.js';
import type { User } from '../../user/models/user.model.js';
import type { UserGroup } from '../../user-group/models/user-group.model.js';

export type { OpenApiSpec };

// Pagination context that the `processPagination` middleware (in
// `shared/database/pagination.js`) parses from `?limit&offset&sortBy
// &sortOrder` and stashes on `req.options`.
export interface PaginationOptions {
  limit: number;
  offset: number;
  order?: any[];
}

// Wider list-context that the `processListQuery` middleware (in
// `shared/util/processListQuery.js`) builds on top of pagination: also
// carries a `where` map for sequelize predicates and tolerates
// slice-specific extras. Stashed on `req.opts`.
export interface ListQueryOptions extends PaginationOptions {
  where: any;
  [k: string]: any;
}

type Slot = 'body' | 'query' | 'params';

// Generic schema-aware validate middleware. On failure responds with
// `{ errors: [...] }` to match the FE error-handling shape inherited
// from this codebase's express-validator era. On success the parsed
// (coerced/transformed) value lands on `req._validated[slot]` rather
// than being reassigned in place - Express 5 made `req.query` a
// read-only getter, so a stash is required for that slot, and using it
// uniformly across body/params keeps the handler's read path consistent
// and avoids mutating raw inputs. The defineAction wrapper reads from
// the stash (falling back to `req[slot]`) when building the handler
// context.
const STASH = '_validated';

function validate(slot: Slot, schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse((req as any)[slot]);
    if (!parsed.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        errors: parsed.error.issues.map((issue) => ({
          type: 'field',
          msg: issue.message,
          path: issue.path.join('.'),
          location: slot,
        })),
      });
    }
    const stash = ((req as any)[STASH] ??= {});
    stash[slot] = parsed.data;
    return next();
  };
}

// Context passed to action handlers.
//   body / query / params  z.infer<typeof Schema>; `undefined` if no
//                          schema declared for that slot.
//   req / res              underlying Express objects.
//   user, repository       shortcuts for fields set by upstream
//                          middleware (auth, /:repositoryId param).
export interface ActionContext<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
> {
  body: TBody;
  query: TQuery;
  params: TParams;
  // Authenticated principal, set by upstream auth middleware. Optional
  // on routes that allow anonymous access; typed as `User` everywhere
  // else - cast at the slice level when the route guarantees presence.
  user: User;
  // Convenience alias for `req.repository`. Populated by the
  // /:repositoryId param middleware. The Repository type comes through as
  // a type-only import - no runtime coupling.
  repository?: Repository;
  req: ExpressRequest & {
    user?: User;
    // Param-middleware-loaded entities. Each slice's `getX` mw attaches
    // the loaded row to `req` so action handlers read it as `req.X!`
    // without an inline cast. Added here (rather than via per-slice
    // module augmentation) because there's no tsconfig at apps/backend
    // for the IDE to discover ambient declarations from.
    repository?: Repository;
    comment?: Comment;
    contentElement?: ContentElement;
    revision?: Revision;
    activity?: Activity;
    asset?: Asset;
    userGroup?: UserGroup;
    agentSession?: AgentSession;
    authData?: unknown;
    opts?: ListQueryOptions;
    options?: PaginationOptions;
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      path: string;
    };
  };
  res: Response;
}

interface ActionSpec<
  TB extends ZodType | undefined,
  TQ extends ZodType | undefined,
  TP extends ZodType | undefined,
> {
  body?: TB;
  query?: TQ;
  params?: TP;
  // When true, the handler's return value is sent verbatim. By default
  // the wrapper wraps it in `{ data: ... }`. Use `raw: true` for
  // collection responses that already carry metadata at the top level
  // (e.g. list returning `{ total, items }`).
  raw?: boolean;
  // Override the success status. Default: 200 with body, 204 without.
  status?: number;
  openapi?: OpenApiSpec;
  handler: (
    ctx: ActionContext<
      TB extends ZodType ? z.infer<TB> : undefined,
      TQ extends ZodType ? z.infer<TQ> : undefined,
      TP extends ZodType ? z.infer<TP> : undefined
    >,
  ) => unknown | Promise<unknown>;
}

// 💄 for declaring a top-level handler outside `defineAction(...)` -
// `async function handler(ctx: Ctx<{ body: typeof Body }>) { ... }` gives
// you the same inferred body/query/params types as the inline form, but
// keeps the action file flat (schemas + handler + defineAction sit side
// by side rather than nested inside the action call).
//
// `infer X extends ZodType` checks BOTH that the slot is present AND
// that it's a Zod schema. The default `{}` makes Ctx (no args) resolve
// to ActionContext<undefined, undefined, undefined>.
type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Ctx<S extends Schemas = {}> = ActionContext<
  S extends { body: infer B extends ZodType } ? z.infer<B> : undefined,
  S extends { query: infer Q extends ZodType } ? z.infer<Q> : undefined,
  S extends { params: infer P extends ZodType } ? z.infer<P> : undefined
>;

export interface CompiledAction {
  middleware: RequestHandler[];
  handler: RequestHandler;
  spec: {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
    openapi?: OpenApiSpec;
  };
}

// Identity factory: declares an action's input schemas, OpenAPI metadata,
// and handler in one place. Returns a compiled object the router consumes.
//
// Response contract (three patterns):
//
//   1. Handler returns a value (any JSON-serialisable shape)
//      -> wrapper sends `<spec.status ?? 200>` with body
//         `{ data: <value> }` (or `<value>` verbatim when `raw: true`)
//
//   2. Handler returns nothing / `undefined`
//      -> wrapper sends `<spec.status ?? 204>` with empty body
//
//   3. Handler calls `res.json(...)` / `res.end(...)` / streams via `res`
//      -> wrapper sees `res.headersSent` and bails; the handler owns the
//         response shape. Use for SSE, file streams, manual envelopes.
//
// Errors thrown (or returned via `createError(...)`) bubble through
// next(err) to the global error middleware.
export function defineAction<
  TB extends ZodType | undefined = undefined,
  TQ extends ZodType | undefined = undefined,
  TP extends ZodType | undefined = undefined,
>(spec: ActionSpec<TB, TQ, TP>): CompiledAction {
  const middleware: RequestHandler[] = [];
  if (spec.body) middleware.push(validate('body', spec.body));
  if (spec.query) middleware.push(validate('query', spec.query));
  if (spec.params) middleware.push(validate('params', spec.params));

  const raw = spec.raw ?? false;

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const stash = ((req as any)[STASH] ?? {}) as Record<Slot, unknown>;
      const result = await spec.handler({
        body: (stash.body ?? (req as any).body) as any,
        query: (stash.query ?? (req as any).query) as any,
        params: (stash.params ?? (req as any).params) as any,
        user: (req as any).user,
        repository: (req as any).repository,
        req: req as ActionContext<any, any, any>['req'],
        res,
      });
      if (res.headersSent) return;
      if (result === undefined) {
        return res.status(spec.status ?? StatusCodes.NO_CONTENT).end();
      }
      const payload = raw ? result : { data: result };
      return res.status(spec.status ?? StatusCodes.OK).json(payload);
    } catch (err) {
      return next(err);
    }
  };

  return {
    middleware,
    handler,
    spec: {
      body: spec.body,
      query: spec.query,
      params: spec.params,
      openapi: spec.openapi,
    },
  };
}

interface MountOpts {
  // Middleware that runs BEFORE schema validation: auth, access checks,
  // multipart parsers, anything that decides whether the request should
  // proceed to validation at all.
  before?: RequestHandler[];
  // Middleware that runs AFTER validation and before the handler. Use
  // this for steps that depend on the parsed/typed values - e.g.
  // processQuery, which builds Sequelize options from req.query.
  after?: RequestHandler[];
}

export interface ActionMounter {
  get: (path: string, action: CompiledAction, opts?: MountOpts) => ActionMounter;
  post: (path: string, action: CompiledAction, opts?: MountOpts) => ActionMounter;
  patch: (path: string, action: CompiledAction, opts?: MountOpts) => ActionMounter;
  put: (path: string, action: CompiledAction, opts?: MountOpts) => ActionMounter;
  delete: (path: string, action: CompiledAction, opts?: MountOpts) => ActionMounter;
}

// Per-slice spec passed to createActionMounter.
//   - `tag`   : sidebar label (one per slice) shown in Scalar
//   - `group` : optional thematic bucket; multiple slices can share
//               one to render under a common `x-tagGroups` section
//               (e.g. Asset, Discovery, Indexing in `group: 'Library'`).
export interface MountSpec {
  tag: string;
  group?: string;
}

// Monotonic per-mounter creation index. Stamped onto every route a
// mounter registers, so the OpenAPI emitter can order tags by
// mounter declaration order rather than by route-registration order.
// This is what lets a slice declare mounters in the order it wants
// the docs sidebar to read (CRUD → Structure → ... → Linked content)
// while still registering individual routes in whatever order Express
// matching needs (e.g. literal `/link` before `/:activityId`).
let mounterCounter = 0;

/**
 * Returns a fluent route binder. Each call wires the route onto the
 * Express router AND records the (method, path, action) triple in the
 * shared OpenAPI registry. `basePath` is prepended to every recorded
 * path so the captured table matches what the outside world sees
 * (e.g. `/repositories/:repositoryId/users`).
 *
 * The third arg is either a plain tag string (most slices) or a
 * `MountSpec` carrying both tag and an explicit theme group.
 *
 * Tag disambiguation: OpenAPI tags are global. When a `MountSpec`
 * carries both `tag` and `group`, the registered tag is auto-prefixed
 * to `<group> / <tag>` so two slices can both use short generic names
 * (e.g. `CRUD`, `Lifecycle`) without their routes colliding under
 * whichever slice declared the tag first. The original short label is
 * preserved on `displayTag` and rendered via `x-displayName` so Scalar
 * keeps showing the short name in the sidebar.
 */
export function createActionMounter(
  router: Router,
  basePath: string,
  spec: string | MountSpec,
): ActionMounter {
  const { tag: rawTag, group } =
    typeof spec === 'string' ? { tag: spec } : spec;
  const tag = group && rawTag ? `${group} / ${rawTag}` : rawTag;
  const displayTag = group && rawTag ? rawTag : undefined;
  const mounterOrder = mounterCounter++;
  function bind(method: HttpMethod) {
    return (
      path: string,
      action: CompiledAction,
      opts: MountOpts = {},
    ): ActionMounter => {
      const before = opts.before ?? [];
      const after = opts.after ?? [];
      (router as any)[method](
        path,
        ...before,
        ...action.middleware,
        ...after,
        action.handler,
      );
      appendRoute({
        method,
        path: joinPath(basePath, path),
        body: action.spec.body,
        query: action.spec.query,
        params: action.spec.params,
        openapi: action.spec.openapi,
        tag,
        ...(displayTag && { displayTag }),
        ...(group && { group }),
        mounterOrder,
      });
      return api;
    };
  }
  const api: ActionMounter = {
    get: bind('get'),
    post: bind('post'),
    patch: bind('patch'),
    put: bind('put'),
    delete: bind('delete'),
  };
  return api;
}

function joinPath(base: string, suffix: string) {
  if (!base) return suffix;
  if (!suffix || suffix === '/') return base;
  return `${base.replace(/\/$/, '')}/${suffix.replace(/^\//, '')}`;
}
