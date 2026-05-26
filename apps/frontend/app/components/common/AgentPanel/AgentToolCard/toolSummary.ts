/**
 * One-line tool-call summary for the dock's tool card;
 * New tools without an entry render no summary.
 */
type ToolResult = Record<string, any>;
type SummaryFn = (result: ToolResult) => string;

const countOf =
  (key: string, label = key): SummaryFn =>
    (r) => (r[key]?.length ? `${r[key].length} ${label}` : '');

const idWithType: SummaryFn = (r) =>
  r.id ? `#${r.id} ${r.type || ''}`.trim() : '';

const idWithName: SummaryFn = (r) =>
  r.id ? `#${r.id} ${r.name || ''}`.trim() : '';

const nestedIdWithType =
  (key: string): SummaryFn =>
    (r) =>
      r[key]?.id ? `#${r[key].id} ${r[key].type || ''}`.trim() : '';

const SUMMARIES: Record<string, SummaryFn> = {
  get_repository: (r) => r.name || '',
  get_schema_info: (r) => r.name || r.schemaId || '',
  get_outline: countOf('activities'),
  generate_outline: countOf('activities'),
  get_activity: idWithType,
  get_activity_subtree: (r) => {
    const children = r.subtree?.children?.length;
    if (children) return `${children} children`;
    const elements = r.subtree?.elements?.length;
    if (elements) return `${elements} elements`;
    return '';
  },
  create_activity: idWithName,
  create_container_with_elements: (r) => {
    const sub = r.subcontainer?.id ? `#${r.subcontainer.id}` : '';
    const el = r.elements?.length ? `${r.elements.length} elements` : '';
    return [sub, el].filter(Boolean).join(' - ');
  },
  generate_container_content: countOf('items'),
  list_elements: countOf('elements'),
  get_element: idWithType,
  refine_element: nestedIdWithType('element'),
  update_element: nestedIdWithType('element'),
  add_elements_to_activity: countOf('elements', 'added'),
  generate_elements_for_target: countOf('elements', 'generated'),
  delete_element: (r) => (r.id ? `#${r.id} deleted` : ''),
  list_assets: (r) => (r.total != null ? `${r.total} assets` : ''),
  index_assets: countOf('queuedAssetIds', 'queued'),
  generate_image_asset: idWithName,
  attach_asset_to_activity: (r) =>
    r.metaKey ? `${r.metaKey} <- ${r.asset?.name || ''}` : '',
};

/**
 * Resolve the glanceable summary for a tool call. The error message wins
 * when present; otherwise dispatches to the per-tool formatter,
 * defaulting to an empty string when no formatter is registered.
 */
export function getToolSummary(name: string, result: unknown): string {
  const r = (result ?? {}) as ToolResult;
  if (r.error) return r.message || r.error;
  try {
    return SUMMARIES[name]?.(r) || '';
  } catch {
    return '';
  }
}
