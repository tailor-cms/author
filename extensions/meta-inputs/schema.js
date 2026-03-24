import { elements } from './server.js';

const DEFAULT_SCHEMA = { type: 'string' };

const schemaByType = Object.fromEntries(
  elements.map((el) => [el.type, el.schema]),
);

export const getSchema = (type, field = {}) => {
  const schema = schemaByType[type];
  if (schema === undefined) return DEFAULT_SCHEMA;
  if (schema === null) return null;
  return typeof schema === 'function' ? schema(field) : schema;
};
