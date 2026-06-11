// Barrel for the shared OpenAPI module.
export {
  appendRoute,
  getRegisteredRoutes,
  type HttpMethod,
  type OpenApiSpec,
  type RouteRecord,
} from './registry.ts';

export {
  OPENAPI_SPEC_PATH,
  buildOpenApiDocument,
  buildPaths,
  writeOpenApiSnapshot,
} from './emitter.ts';

export { default as openApiDocsRouter } from './docs.ts';
