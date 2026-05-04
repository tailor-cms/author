// Tool registry
import type { ToolDef } from './types.ts';

import {
  create_activity,
  create_outline,
  create_container_with_elements,
  delete_activity,
  restore_activity,
  generate_outline,
  generate_container_content,
  get_activity,
  attach_asset_to_activity,
  get_activity_subtree,
  get_outline,
  move_activity,
  update_activity,
} from './activity/index.ts';

import {
  discover_resources,
  generate_image_asset,
  get_asset,
  import_resource,
  index_assets,
  list_assets,
} from './assets/index.ts';

import {
  add_elements_to_activity,
  delete_element,
  generate_elements_for_target,
  get_element,
  list_elements,
  refine_element,
  update_element,
} from './content-elements/index.ts';

import {
  ask_user_question,
} from './interaction/index.ts';

import {
  get_outline_context,
  get_repository,
  get_schema_info,
} from './repository/index.ts';

export type { ToolContext, ToolDef } from './types.ts';

export const TOOL_DEFS: ToolDef[] = [
  // repository
  get_repository,
  get_schema_info,
  get_outline_context,
  // activity
  get_outline,
  get_activity,
  get_activity_subtree,
  create_activity,
  create_outline,
  update_activity,
  delete_activity,
  restore_activity,
  move_activity,
  create_container_with_elements,
  attach_asset_to_activity,
  generate_outline,
  generate_container_content,
  // content-element
  list_elements,
  get_element,
  add_elements_to_activity,
  generate_elements_for_target,
  update_element,
  delete_element,
  refine_element,
  // asset
  list_assets,
  get_asset,
  discover_resources,
  import_resource,
  generate_image_asset,
  index_assets,
  // interaction
  ask_user_question,
];

export function buildOpenAITools(
  vectorStoreId?: string | null,
) {
  const tools: any[] = TOOL_DEFS.map((t) => ({
    type: 'function' as const,
    name: t.name,
    description: t.description,
    parameters: t.parameters,
    strict: false,
  }));
  if (vectorStoreId) {
    tools.push({
      type: 'file_search',
      vector_store_ids: [vectorStoreId],
    });
  }
  return tools;
}

export function findTool(
  name: string,
): ToolDef | undefined {
  return TOOL_DEFS.find((t) => t.name === name);
}
