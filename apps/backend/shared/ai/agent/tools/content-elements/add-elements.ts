import { oneLine, stripIndent } from 'common-tags';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  recordOperation,
  toolError,
} from '../helpers/index.ts';
import { resolveElementHost } from '../activity/helpers.ts';
import { nextElementPosition, normalizeElementData } from './helpers.ts';
import { createAiLogger } from '../../../logger.ts';

const logger = createAiLogger('agent.tools.add-elements');

const { ContentElement } = db as any;

const TOOL = 'add_elements_to_activity';

interface ElementItem {
  type: string;
  data: Record<string, any>;
  position?: number | null;
}

interface Input {
  activityId: number;
  elements: ElementItem[];
}

const description = stripIndent`
  Append content elements to an existing activity. Use
  when the user wants to add content inside an activity
  that already exists, not create a new container. Call
  generate_elements_for_target first to generate the
  elements, then pass the result here. Call get_schema_info
  to see which element types each container supports.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: oneLine`
        Activity to append elements into. Get the id from
        get_activity_subtree.
      `,
    },
    elements: {
      type: 'array',
      description: oneLine`
        Elements to create, in display order. Each needs
        type and data. Pass from generate_elements_for_target
        verbatim, or construct manually using element schemas
        from get_schema_info.
      `,
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: oneLine`
              Content element type. Must be allowed for this
              activity per the schema.
            `,
          },
          data: {
            type: 'object',
            description: 'Element payload - structure varies by type.',
            additionalProperties: true,
          },
        },
        required: ['type', 'data'],
        additionalProperties: true,
      },
    },
  },
  required: ['activityId', 'elements'],
  additionalProperties: false,
};

/**
 * Validate that all supplied element types are allowed
 * for the target activity by the repository schema.
 */
function validateTypes(elements: ElementItem[], allowed: string[]) {
  const invalid = elements.filter((el) => !allowed.includes(el.type));
  if (!invalid.length) return null;
  return toolError({
    tool: TOOL,
    reason: 'invalid_type',
    message: `${invalid.length} element(s) have disallowed types.`,
    allowedElementTypes: allowed,
    invalidElementTypes: [...new Set(invalid.map((el) => el.type))],
  });
}

/**
 * Append content elements to an existing activity.
 * Validates element types against the schema and creates
 * each element in sequence. Failures are non-fatal -
 * skipped elements are logged, successful ones returned.
 */
async function execute(input: Input, ctx: ToolContext) {
  const resolved = await resolveElementHost(TOOL, input.activityId, ctx);
  if ('error' in resolved) return resolved;
  const { host: target, allowedTypes: allowed } = resolved;

  const typeError = validateTypes(input.elements, allowed);
  if (typeError) return typeError;

  let position = await nextElementPosition(ctx.repository.id, target.id);
  const created: any[] = [];
  const failed: Array<{ index: number; type: string; reason: string }> = [];
  for (let i = 0; i < input.elements.length; i++) {
    const element = input.elements[i];
    try {
      const data = normalizeElementData(element.type, element.data);
      const record = await ContentElement.create(
        {
          type: element.type,
          data,
          position:
            typeof element.position === 'number'
              ? element.position
              : position++,
          activityId: target.id,
          repositoryId: ctx.repository.id,
        },
        { context: dbContext(ctx) },
      );
      created.push(record);
    } catch (err: any) {
      // Per-element failures are non-fatal so the rest of the
      // batch still persists, but report what failed so the LLM
      // and the user can correct it on the next turn.
      logger.warn(
        { err: err.message, type: element.type, index: i },
        'element create failed',
      );
      failed.push({
        index: i,
        type: element.type,
        reason: err.message || 'unknown',
      });
    }
  }
  const result = {
    ok: true,
    activityId: target.id,
    elements: created,
    ...(failed.length ? { failed } : {}),
    _invalidates: [
      `activity:${target.id}`,
      ...(target.parentId ? [`activity:${target.parentId}`] : []),
    ],
  };
  recordOperation(TOOL, ctx);
  return result;
}

export const add_elements_to_activity: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};
