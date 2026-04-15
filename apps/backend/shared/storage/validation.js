import { ValidationError } from 'yup';

export { validateConfig };

function validateConfig(config, schema) {
  try {
    return schema.validateSync(config, { stripUnknown: true });
  } catch (error) {
    if (!ValidationError.isError(error)) throw error;
    const err = new Error('Unsupported config structure');
    err.cause = error;
    throw err;
  }
}
