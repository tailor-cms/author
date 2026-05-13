// Barrel for the shared OpenAPI module.
export {
  appendRoute,
  getRegisteredRoutes,
  type HttpMethod,
  type OpenApiSpec,
  type RouteRecord,
} from './registry.ts';

export { buildOpenApiDocument, buildPaths } from './emitter.ts';
