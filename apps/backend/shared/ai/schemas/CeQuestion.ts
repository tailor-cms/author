import { v4 as uuidv4 } from 'uuid';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import pick from 'lodash/pick.js';
import times from 'lodash/times.js';

import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'ce_question_elements',
  schema: {
    type: 'object',
    properties: {
      elements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { enum: [ContentElementType.MultipleChoice] },
            question: { type: 'string' },
            answers: { type: 'array', items: { type: 'string' } },
            correct: { type: 'array', items: { type: 'integer' } },
            feedback: {
              type: 'object',
              // OpenAI does not support pattern properties
              properties: times(4).reduce(
                (acc, it) => ({ ...acc, [it]: { type: 'string' } }),
                {},
              ),
              required: times(4, String),
              additionalProperties: false,
            },
            hint: { type: 'string' },
          },
          required: [
            'type',
            'question',
            'answers',
            'correct',
            'feedback',
            'hint',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['elements'],
    additionalProperties: false,
  },
};

export const getPrompt = () => `
  Generate multiple choice questions as an array of question element objects.
  Each object should have the following properties:
  {
    "type": "${ContentElementType.MultipleChoice}",
    "question": "",
    "correct": [],
    "answers": [],
    "hint": "",
    "feedback": {}
  }
  where:
    - 'question' is the question prompt
    - 'answers' is an array of possible answers. Define 4 possible answers.
    - 'correct' is an array of indexes of the correct answers (one or more
      answers can be correct)
    - 'hint' is an optional hint for the correct solution
    - 'feedback' is an object with feedback for each answer, using indexes as
      keys. Feedback is optional and should provide more information
      about the answers.`;

export const processResponse = (data: any = {}) => {
  const { elements } = data;
  if (!elements?.length) return [];
  return elements?.map((it) => {
    const uuid = uuidv4();
    return {
      type: ContentElementType.MultipleChoice,
      data: {
        isGradable: true,
        question: [uuid],
        ...pick(it, ['correct', 'answers', 'hint', 'feedback']),
        embeds: {
          [uuid]: {
            id: uuid,
            data: { content: it.question },
            embedded: true,
            position: 1,
            type: ContentElementType.TiptapHtml,
          },
        },
      },
    };
  });
};

const spec: AiResponseSpec = {
  getPrompt,
  Schema,
  processResponse,
};

export default spec;
