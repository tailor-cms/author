import { oneLine, stripIndent } from 'common-tags';
import type { ToolDef } from '../types.ts';

const TOOL = 'ask_user_question';

interface OptionItem {
  label: string;
  prompt: string;
  hint?: string | null;
}

interface Input {
  title: string;
  question: string;
  options: OptionItem[];
  allowOther?: boolean | null;
}

const description = stripIndent`
  Show a clickable picker whenever you need the user
  to choose between named options. Use this instead of
  plain-text "do you mean A, B, or C?" questions.
  After calling this tool, STOP. Do not call other
  tools or fabricate the user's answer.
`;

const parameters = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Short category label (e.g. "Format").',
    },
    question: {
      type: 'string',
      description: 'Full question text.',
    },
    options: {
      type: 'array',
      minItems: 2,
      maxItems: 10,
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: 'Button label (40 chars max).',
          },
          hint: {
            type: ['string', 'null'],
            description: 'One-line clarification.',
          },
          prompt: {
            type: 'string',
            description: oneLine`
              Message sent back when picked. Write as if the user typed it.
            `,
          },
        },
        required: ['label', 'prompt'],
        additionalProperties: false,
      },
    },
    allowOther: {
      type: ['boolean', 'null'],
      description: 'Show free-text "Other" option (default true).',
    },
  },
  required: ['title', 'question', 'options'],
  additionalProperties: false,
};

/**
 * Present a multiple-choice picker to the user and
 * return the proposed question payload. The runner
 * pauses execution until the user selects an option.
 */
async function execute(input: Input) {
  return {
    ok: true,
    proposed: true,
    title: input.title,
    question: input.question,
    options: input.options,
    allowOther: input.allowOther !== false,
  };
}

export const ask_user_question: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};
