import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import type { OpenAISchema } from './utils/OpenAISchema.ts';

export const QuestionResponseSchema: OpenAISchema = {
  type: 'json_schema',
  name: 'ce_question_elements',
  schema: {
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
          patternProperties: { '^I': { type: 'boolean' } },
        },
        hint: { type: 'string' },
      },
    },
  },
};

export const QuestionResponsePrompt = `
  Return an array of question element objects.
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
    - 'answers' is an array of possible answers
    - 'correct' is an array of indexes of the correct answers (one or more
       answers can be correct)
    - 'hint' is an optional hint for the correct solution
    - 'feedback' is an object with feedback for each answer, using indexes as
      keys. Feedback is optional and should provide more information
      about the answers.
`;

export const QuestionResponse = {
  Prompt: QuestionResponsePrompt,
  Schema: QuestionResponseSchema,
};
