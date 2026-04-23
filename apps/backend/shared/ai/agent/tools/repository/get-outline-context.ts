import { oneLine, stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import { buildOutlineContext, formatEnvelope } from '../../context/index.ts';
import { toolError } from '../helpers/index.ts';

const TOOL = 'get_outline_context';

interface Input {
  activityId: number;
  radius?: number | null;
  includeStyle?: boolean | null;
  allowHoist?: boolean | null;
}

const description = stripIndent`
  Return a bounded envelope of course context for an activity:
  ancestor path, preceding siblings with content summaries,
  following sibling titles, the focused activity's own summary
  if it already has content, and optionally a voice sample
  from a completed sibling. Use this before generating content
  for a topic so the output fits the surrounding material and
  does not repeat what earlier topics already cover.
  Generation tools already auto-include this context, so call
  this tool only when you want to inspect it yourself or pass
  a custom radius.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: oneLine`
        Activity to build context for. Typically the outline
        leaf (topic, page, etc.) you are about to fill.
      `,
    },
    radius: {
      type: ['integer', 'null'],
      description: oneLine`
        How many preceding and following siblings to include.
        Defaults to 2. Use 4+ when filling many topics in a row
        so each call sees more neighbors.
      `,
    },
    includeStyle: {
      type: ['boolean', 'null'],
      description: oneLine`
        Include one short excerpt from a written sibling as a
        voice reference. Defaults to true.
      `,
    },
    allowHoist: {
      type: ['boolean', 'null'],
      description: oneLine`
        When the focused activity is a branch (module, submodule),
        include a single compacted summary built from its
        descendants' leaf summaries. Defaults to true.
      `,
    },
  },
  required: ['activityId'],
  additionalProperties: false,
};

// Build the outline-context envelope and return both its structured form
// and the formatted markdown the generation tools embed into prompts.
async function execute(input: Input, ctx: ToolContext) {
  const context = await buildOutlineContext(input.activityId, ctx, {
    radius: input.radius ?? undefined,
    includeStyle: input.includeStyle ?? undefined,
    allowHoist: input.allowHoist ?? undefined,
  });
  if (!context) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.activityId} not found.`,
    });
  }
  return {
    context,
    markdown: formatEnvelope(context),
  };
}

export const get_outline_context: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};
