// Wire shape for the AI generation endpoint.
import { Int } from '#shared/request/schemas.ts';
import { z } from 'zod';

const InputType = z.enum(['CREATE', 'ADD', 'MODIFY']);

const GenerateInputItem = z.looseObject({
  type: InputType.describe('Generation mode for this item.'),
  text: z
    .string()
    .min(1)
    .describe(`User prompt for this generation step.`),
  responseSchema: z
    .string()
    .min(1)
    .describe(`Key of the structured-output schema (Outline, CeHtml, etc.).`),
});

// Repository identity (id, schema, name, description) is resolved from
// the repository-scoped route
export const GenerateInput = z
  .looseObject({
    repository: z
      .looseObject({
        outlineActivityId: Int()
          .optional()
          .describe('Outline activity the content is generated for.'),
        outlineActivityType: z
          .string()
          .optional()
          .describe('Activity type of the targeted outline node.'),
        containerType: z
          .string()
          .optional()
          .describe('Content container type receiving the content.'),
        topic: z
          .string()
          .optional()
          .describe('Topic of the generated content (e.g. leaf node title).'),
      })
      .optional()
      .describe('Location context within the repository.'),
    content: z
      .string()
      .optional()
      .describe('Existing content the request builds on (Add/Modify modes).'),
    inputs: z.array(GenerateInputItem).min(1).describe(
      'Ordered list of generation steps; processed in sequence.',
    ),
  })
  .describe('Payload for AI content generation.');

export type GenerateInput = z.infer<typeof GenerateInput>;
