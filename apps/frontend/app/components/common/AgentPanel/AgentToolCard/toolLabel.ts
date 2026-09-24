import pluralize from 'pluralize-esm';

type ToolInput = Record<string, any>;
type FindName = (activityId: number) => string | undefined;

interface LabelSpec {
  // Present and past tense of what the tool does.
  verb: [doing: string, done: string];
  // What it works on
  target?: (input: ToolInput, findName: FindName) => string;
}

const MAX_TEXT = 32;

function clip(text: string): string {
  if (text.length <= MAX_TEXT) return text;
  return `${text.slice(0, MAX_TEXT - 1).trimEnd()}…`;
}

// “value” with an optional prefix
function quoted(value?: string | null, prefix = ''): string {
  return value ? `${prefix} “${clip(value)}”`.trim() : '';
}

const join = (...parts: string[]) => parts.filter(Boolean).join(' ');

// <noun> <prefix> “<activity name>”, e.g. content for “Intro”.
const aboutActivity =
  (noun: string, prefix: string, key = 'activityId') =>
    (input: ToolInput, findName: FindName) =>
      join(noun, quoted(findName(input[key]), prefix));

// “<activity name>”, e.g. “Intro”, looked up in the activity
// store by the input's id; an activity when there is no name.
const activityName = (key = 'id') =>
  (input: ToolInput, findName: FindName) =>
    quoted(findName(input[key])) || 'an activity';

const anElement = () => 'an element';

const countOf = (key: string, noun: string) =>
  (input: ToolInput) => pluralize(noun, input[key]?.length ?? 0, true);

const repositoryLabels: Record<string, LabelSpec> = {
  get_outline_context: {
    verb: ['Reviewing', 'Reviewed'],
    target: aboutActivity('context', 'around'),
  },
  get_repository: { verb: ['Reading', 'Read'], target: () => 'the repository' },
  get_schema_info: {
    verb: ['Checking', 'Checked'],
    target: () => 'the content structure',
  },
};

const activityLabels: Record<string, LabelSpec> = {
  attach_asset_to_activity: {
    verb: ['Attaching', 'Attached'],
    target: aboutActivity('media', 'to'),
  },
  create_activity: {
    verb: ['Creating', 'Created'],
    target: (input) => quoted(input.data?.name) || 'an activity',
  },
  create_container_with_elements: {
    verb: ['Adding', 'Added'],
    target: aboutActivity('content', 'to', 'outlineActivityId'),
  },
  create_outline: {
    verb: ['Building', 'Built'],
    target: countOf('activities', 'outline item'),
  },
  delete_activity: { verb: ['Deleting', 'Deleted'], target: activityName() },
  generate_container_content: {
    verb: ['Drafting', 'Drafted'],
    target: aboutActivity('content', 'for'),
  },
  generate_outline: {
    verb: ['Drafting', 'Drafted'],
    target: (input) => join('an outline', quoted(input.subject, 'for')),
  },
  get_activity: { verb: ['Reading', 'Read'], target: activityName() },
  get_activity_subtree: {
    verb: ['Reading', 'Read'],
    target: activityName('activityId'),
  },
  get_outline: { verb: ['Reading', 'Read'], target: () => 'the outline' },
  move_activity: { verb: ['Moving', 'Moved'], target: activityName() },
  restore_activity: { verb: ['Restoring', 'Restored'], target: activityName() },
  update_activity: { verb: ['Updating', 'Updated'], target: activityName() },
};

const elementLabels: Record<string, LabelSpec> = {
  add_elements_to_activity: {
    verb: ['Adding', 'Added'],
    target: (input, findName) =>
      join(
        pluralize('element', input.elements?.length ?? 0, true),
        quoted(findName(input.activityId), 'to'),
      ),
  },
  delete_element: { verb: ['Deleting', 'Deleted'], target: anElement },
  generate_elements_for_target: {
    verb: ['Drafting', 'Drafted'],
    target: aboutActivity('content', 'for'),
  },
  get_element: { verb: ['Reading', 'Read'], target: anElement },
  list_elements: {
    verb: ['Reading', 'Read'],
    target: aboutActivity('content', 'of'),
  },
  refine_element: { verb: ['Refining', 'Refined'], target: anElement },
  update_element: { verb: ['Updating', 'Updated'], target: anElement },
};

const assetLabels: Record<string, LabelSpec> = {
  discover_resources: {
    verb: ['Searching', 'Searched'],
    target: (input) => join('the web', quoted(input.query, 'for')),
  },
  generate_image_asset: {
    verb: ['Generating', 'Generated'],
    target: () => 'an image',
  },
  get_asset: { verb: ['Checking', 'Checked'], target: () => 'an asset' },
  import_resource: {
    verb: ['Importing', 'Imported'],
    target: (input) => quoted(input.title) || 'a resource',
  },
  index_assets: {
    verb: ['Indexing', 'Indexed'],
    target: countOf('assetIds', 'asset'),
  },
  list_assets: {
    verb: ['Searching', 'Searched'],
    target: (input) => join('the asset library', quoted(input.search, 'for')),
  },
};

const interactionLabels: Record<string, LabelSpec> = {
  ask_user_question: { verb: ['Asking', 'Asked'], target: () => 'a question' },
};

const LABELS: Record<string, LabelSpec> = {
  ...repositoryLabels,
  ...activityLabels,
  ...elementLabels,
  ...assetLabels,
  ...interactionLabels,
};

// move_activity -> "Move activity"
function humanize(name: string): string {
  const text = name.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getToolLabel(
  name: string,
  input: unknown,
  opts: { isDone: boolean; findName: FindName },
): string {
  const spec = LABELS[name];
  if (!spec) return humanize(name);
  const params = (input && typeof input === 'object' ? input : {}) as ToolInput;
  const [doing, done] = spec.verb;
  const target = spec.target?.(params, opts.findName) ?? '';
  return join(opts.isDone ? done : doing, target);
}
