import Edit from './EditMeta.vue';

export default {
  type: 'COMBOBOX',
  version: '1.0',
  schema: (field) =>
    field.multiple
      ? { type: 'array', items: { type: 'string' } }
      : { type: 'string' },
  Edit,
};
