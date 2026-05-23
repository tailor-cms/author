// Meta input default resolution. Reads from the
// installed meta input registry to derive sensible
// empty values for schema-defined meta fields.
import { getSchema as metaInputSchema }
  from '@tailor-cms/meta-element-collection/schema.js';

/**
 * Derive a sensible empty default from a meta input's
 * registered JSON Schema type. Falls back to the field's
 * defaultValue if set, then resolves from the registry.
 */
export function defaultForMeta(field: any): any {
  if (field.defaultValue != null) return field.defaultValue;
  const schema = metaInputSchema(field.type, field);
  if (!schema) return null;
  const jsonType = schema.type;
  if (jsonType === 'string') return '';
  if (jsonType === 'number' || jsonType === 'integer') return 0;
  if (jsonType === 'boolean') return false;
  if (jsonType === 'array') return [];
  if (jsonType === 'object') return {};
  return null;
}

/**
 * Merge input data with schema-derived defaults for
 * missing meta fields. Returns the merged data plus
 * which keys were expected vs auto-filled. Works for
 * any entity with schema meta.
 */
export function mergeMetaDefaults(
  metaFields: any[],
  data: Record<string, any> = {},
) {
  const expectedKeys = metaFields.map((m: any) => m.key);
  const mergedData: Record<string, any> = { ...data };
  const missingKeys: string[] = [];
  for (const field of metaFields) {
    if (mergedData[field.key] != null) continue;
    mergedData[field.key] = defaultForMeta(field);
    missingKeys.push(field.key);
  }
  return { mergedData, missingKeys, expectedKeys };
}
