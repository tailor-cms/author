// @hey-api/openapi-ts driver config.
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './dist/spec.json',
  output: './dist/generated',
  plugins: [
    // Axios-backed client. Callers pass their pre-configured axios
    // instance (with /api baseURL, auth cookie, 401 redirect interceptor)
    // into `createClient` and hand the result to `createApiClient`, so
    // existing FE behaviour is preserved.
    '@hey-api/client-axios',
    {
      name: '@hey-api/sdk',
      operations: 'flat',
      // Don't bake an internal singleton client; the namespace wrapper
      // threads a user-supplied client through every call.
      client: false,
    },
    '@hey-api/typescript',
  ],
});
