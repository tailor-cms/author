import { env } from './env.ts';
import { isProduction } from './runtime.ts';

export const secretKey = env.AI_SECRET_KEY;
export const modelId = env.AI_MODEL_ID;
export const imageModelId = env.AI_IMAGE_MODEL_ID;
export const isEnabled = !!(secretKey && modelId);

// Headless browser used to run and check AI-written interactive content.
export const browser = {
  url: env.AI_SANDBOX_BROWSER_URL,
  protocol: env.AI_SANDBOX_BROWSER_PROTOCOL,
  maxConcurrentRuns: env.AI_SANDBOX_MAX_CONCURRENT_RUNS,
  // Production can only run generated code in a remote browser
  isSandboxAvailable: !!env.AI_SANDBOX_BROWSER_URL || !isProduction,
};

const envSuffix = isProduction ? '' : `-${env.NODE_ENV}`;

export const vectorStore = {
  name: `tailor-cms${envSuffix}`,
  expiresAfter: {
    anchor: 'last_active_at',
    days: env.AI_VECTOR_STORE_EXPIRY_DAYS,
  } as const,
};
