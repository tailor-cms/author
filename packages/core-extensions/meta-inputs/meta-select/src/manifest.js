export default {
  type: 'SELECT',
  version: '1.0',
  schema: (field) => {
    const isNumeric = field.options?.some((o) => typeof o.value === 'number');
    const valueType = isNumeric ? 'number' : 'string';
    return field.multiple
      ? { type: 'array', items: { type: valueType } }
      : { type: valueType };
  },
};
