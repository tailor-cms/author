// Schema-driven lookups via the config-parser API.
import type { Schema } from '@tailor-cms/interfaces/schema';
import { schema as schemaAPI } from '@tailor-cms/config';
import PluginRegistry from '#shared/content-plugins/index.js';

const api = schemaAPI as any;
const { containerRegistry } = PluginRegistry;

// Resolve a parsed schema by id.
export function getSchema(schemaId: string): Schema {
  return api.getSchema(schemaId);
}

// Strip the schema prefix from a namespaced type.
// "EXAMPLE_SCHEMA/MODULE" -> "MODULE"
// "DEFAULT_SECTION" -> "DEFAULT_SECTION"
export function stripSchemaPrefix(type: string): string {
  if (!type) return type;
  const idx = type.lastIndexOf('/');
  return idx >= 0 ? type.slice(idx + 1) : type;
}

// Resolve a bare or namespaced type from the LLM to the
// canonical namespaced form the DB expects. Case-insensitive
// match against the schema's outline levels.
// Returns null if the type doesn't match any outline level.
//
// resolveOutlineType("EXAMPLE_SCHEMA", "module")
//   -> "EXAMPLE_SCHEMA/MODULE"
// resolveOutlineType("EXAMPLE_SCHEMA", "EXAMPLE_SCHEMA/TOPIC")
//   -> "EXAMPLE_SCHEMA/TOPIC"
// resolveOutlineType("EXAMPLE_SCHEMA", "UNKNOWN")
//   -> null
export function resolveOutlineType(
  schemaId: string,
  type: string,
): string | null {
  if (!type) return null;
  const bare = stripSchemaPrefix(type).toLowerCase();
  const levels = api.getOutlineLevels(schemaId) as any[];
  const match = levels.find(
    (lvl: any) => stripSchemaPrefix(lvl.type).toLowerCase() === bare,
  );
  return match?.type || null;
}

// Resolve a human-readable label for any type in the schema.
// Handles outline types (fully prefixed or bare), container
// types, and subcontainer types by delegating to the
// config-parser API and containerRegistry.
//
// resolveLabel("EXAMPLE_SCHEMA", "EXAMPLE_SCHEMA/MODULE")
//   -> "Module"
// resolveLabel("EXAMPLE_SCHEMA", "TOPIC")
//   -> "Topic"
// resolveLabel("EXAMPLE_SCHEMA", "SECTION_CONTAINER")
//   -> "Sections"
// resolveLabel("EXAMPLE_SCHEMA", "DEFAULT_SECTION")
//   -> "Section"
export function resolveLabel(schemaId: string, type: string): string {
  // Outline activity: resolve bare names to canonical form,
  // then let the config-parser return the label.
  const canonical = resolveOutlineType(schemaId, type);
  if (canonical) {
    const level = api.getLevel(canonical);
    if (level?.label) return level.label;
  }
  // Container or subcontainer: delegate to the registry
  // which owns the structure for each template.
  return resolveContainerLabel(schemaId, type) || type;
}

// Look up a container or subcontainer label via the
// containerRegistry. Checks top-level container types
// first, then walks subcontainer definitions.
function resolveContainerLabel(
  schemaId: string,
  type: string,
): string | null {
  const schema = getSchema(schemaId);
  if (!schema) return null;
  for (const cc of schema.contentContainers || []) {
    if (cc.type === type) return cc.label || null;
    const desc = containerRegistry.describeSchema(cc);
    const sub = (desc.subcontainers || []).find(
      (s: any) => s.type === type,
    );
    if (sub?.label) return sub.label;
  }
  return null;
}

// Container types attached to an outline activity type.
// E.g. for a TOPIC -> ['SECTION_CONTAINER'].
export function containerTypesForActivity(activityType: string): string[] {
  const containers = api.getSupportedContainers(activityType);
  return (containers || []).map((c: any) => c.type);
}

// Full container structure from its schema config.
// Delegates to the template's describeSchema(config).
// Returns { subcontainers: [] } for flat/unknown templates.
//
// describeContainerSchema("EXAMPLE_SCHEMA", "SECTION_CONTAINER")
//   -> { subcontainers: [
//        { type: "DEFAULT_SECTION", label: "Section",
//          meta: [{ key: "estimatedTime", ... }],
//          elementConfig: [...] }
//      ] }
//
// describeContainerSchema("EXAMPLE_SCHEMA", "ASSESSMENT_POOL")
//   -> { subcontainers: [], elementConfig: [...] }
export function describeContainerSchema(
  schemaId: string,
  containerType: string,
) {
  const container = findContainerDef(schemaId, containerType);
  if (!container) return { subcontainers: [] };
  return containerRegistry.describeSchema(container);
}

// Subcontainer activity types allowed inside a container.
// Derived from the template's describeSchema method.
// Returns [] for flat templates.
export function subcontainerTypesForContainer(
  schemaId: string,
  containerType: string,
): string[] {
  const desc = describeContainerSchema(schemaId, containerType);
  return (desc.subcontainers || []).map((s: any) => s.type);
}

// Collect element types from a container description.
// With subcontainerType: returns that specific subcontainer's
// allowed types. Without: combines across all subcontainers
// (nested) or reads direct elementConfig (flat).
function elementTypesFromContainerDesc(
  desc: any,
  subcontainerType?: string,
): string[] {
  const subs = desc.subcontainers || [];
  // Specific subcontainer lookup
  if (subcontainerType) {
    const match = subs.find((s: any) => s.type === subcontainerType);
    return match?.elementConfig
      ? api.getSupportedElementTypes(match.elementConfig)
      : [];
  }
  // Nested: combine element types across all subcontainers
  if (subs.length) {
    return subs.reduce((acc: string[], sub: any) => {
      if (!sub.elementConfig) return acc;
      for (const t of api.getSupportedElementTypes(sub.elementConfig)) {
        if (!acc.includes(t)) acc.push(t);
      }
      return acc;
    }, []);
  }
  // Flat container: direct elementConfig
  return desc.elementConfig
    ? api.getSupportedElementTypes(desc.elementConfig)
    : [];
}

/**
 * Get which content element types a given activity can host.
 *
 * Three resolution paths:
 *   1. Subcontainer with known parent - authoritative,
 *      returns directly without fallback
 *   2. Container itself - combines element types across
 *      all its subcontainers (or direct config if flat)
 *   3. Outline leaf - combines across all containers
 *      attached to it by the schema
 *
 * @example
 * getAllowedElementTypes("EXAMPLE_SCHEMA", "DEFAULT_SECTION", "SECTION_CONTAINER")
 *   -> ["TIPTAP_HTML", "IMAGE", "MULTIPLE_CHOICE", ...]
 *
 * getAllowedElementTypes("EXAMPLE_SCHEMA", "EXAMPLE_SCHEMA/TOPIC")
 *   -> ["TIPTAP_HTML", "IMAGE", ...] (combined from all TOPIC containers)
 *
 * @param schemaId - Schema identifier
 * @param activityType - Outline type (EXAMPLE_SCHEMA/TOPIC),
 *   container (SECTION_CONTAINER), or subcontainer (DEFAULT_SECTION)
 * @param parentType - Container that owns this subcontainer.
 *   When provided, the lookup is authoritative - returns
 *   the result directly without fallback. Disambiguates
 *   when the same subcontainer type appears in multiple
 *   containers with different element configs.
 */
export function getAllowedElementTypes(
  schemaId: string,
  activityType: string,
  parentType?: string,
): string[] {
  // Subcontainer with known parent - authoritative lookup.
  // e.g. activityType="DEFAULT_SECTION", parentType="SECTION_CONTAINER"
  if (parentType) {
    const desc = describeContainerSchema(schemaId, parentType);
    return elementTypesFromContainerDesc(desc, activityType);
  }
  // Outline leaf - combine across all attached containers.
  // e.g. activityType="EXAMPLE_SCHEMA/TOPIC" which has
  // SECTION_CONTAINER + EXAM -> union of both element sets.
  if (api.isOutlineActivity(activityType)) {
    return (api.getSupportedContainers(activityType) || [])
      .reduce((acc: string[], c: any) => {
        const desc = describeContainerSchema(schemaId, c.type);
        for (const t of elementTypesFromContainerDesc(desc)) {
          if (!acc.includes(t)) acc.push(t);
        }
        return acc;
      }, []);
  }
  // Container type - combine all its subcontainers' element types.
  // e.g. activityType="SECTION_CONTAINER"
  const selfDesc = describeContainerSchema(schemaId, activityType);
  return elementTypesFromContainerDesc(selfDesc);
}

// Meta input definitions for an outline activity type.
// Returns the full meta array from the schema config.
export function metaInputsForActivity(activityType: string): any[] {
  return api.getLevel(activityType)?.meta || [];
}

/**
 * Get meta input definitions for an activity type defined
 * inside a container template. Container definitions are
 * schema-level (not per-activity), so the lookup only
 * needs the schema and the target type.
 *
 * @example
 * getContainerActivityMeta("EXAMPLE_SCHEMA", "DEFAULT_SECTION")
 *   -> [{ key: "estimatedTime", type: "NUMBER", ... }, ...]
 *
 * getContainerActivityMeta("EXAMPLE_SCHEMA", "UNKNOWN")
 *   -> []
 *
 * @param schemaId - Schema identifier
 * @param activityType - The container-level activity type
 *   to find meta for (e.g. "DEFAULT_SECTION")
 */
export function getContainerActivityMeta(
  schemaId: string,
  activityType: string,
): any[] {
  const schema = getSchema(schemaId);
  if (!schema) return [];
  for (const cc of schema.contentContainers || []) {
    const desc = containerRegistry.describeSchema(cc);
    const match = (desc.subcontainers || []).find(
      (s: any) => s.type === activityType,
    );
    if (match) return match.meta || [];
  }
  return [];
}

// Find raw container definition from the schema by type.
function findContainerDef(schemaId: string, containerType: string) {
  const schema = getSchema(schemaId);
  if (!schema) return undefined;
  return schema.contentContainers?.find(
    (it: any) => it.type === containerType,
  );
}
