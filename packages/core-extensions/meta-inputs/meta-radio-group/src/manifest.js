export default {
  type: 'RADIO_GROUP',
  version: '1.0',
  schema: (field) => {
    const isNumeric = field.items?.some((it) => typeof it.value === 'number');
    return { type: isNumeric ? 'number' : 'string' };
  },
};
