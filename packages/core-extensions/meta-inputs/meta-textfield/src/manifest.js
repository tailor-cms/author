export default {
  type: 'TEXT_FIELD',
  version: '1.0',
  i18n: true,
  schema: (field) =>
    field.inputType === 'number' ? { type: 'number' } : { type: 'string' },
};
