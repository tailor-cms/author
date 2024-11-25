export const secretKey = process.env.AI_SECRET_KEY;
export const modelId = process.env.AI_MODEL_ID;
export const isEnabled = secretKey && modelId;
