import { env } from './env.ts';

export const isSeedApiEnabled = env.ENABLE_TEST_API_ENDPOINTS;
