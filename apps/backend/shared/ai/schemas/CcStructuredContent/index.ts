import type { AiResponseSpec } from '../interfaces.ts';
import { Schema } from './schema.ts';
import { getPrompt } from './prompt.ts';
import { processResponse } from './response.ts';

const spec: AiResponseSpec = {
  getPrompt,
  Schema,
  processResponse,
};

export default spec;
export { Schema, getPrompt, processResponse };
