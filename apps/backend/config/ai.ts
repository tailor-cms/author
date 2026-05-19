import { isProduction } from './runtime.ts';

export const secretKey: string | undefined = process.env.AI_SECRET_KEY;
export const modelId: string | undefined = process.env.AI_MODEL_ID;
export const isEnabled: boolean = !!(secretKey && modelId);

const envSuffix = isProduction ? '' : `-${process.env.NODE_ENV || 'dev'}`;

export const vectorStore = {
  name: `tailor-cms${envSuffix}`,
  expiresAfter: {
    anchor: 'last_active_at',
    days: Number(process.env.AI_VECTOR_STORE_EXPIRY_DAYS) || 60,
  } as const,
};
