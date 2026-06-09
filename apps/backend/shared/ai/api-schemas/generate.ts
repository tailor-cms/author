// Wire shape for the AI generation endpoint.
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

export const GenerateInput = z
  .looseObject({
    repository: z
      .looseObject({
        schemaId: z.string().min(1).describe('Schema id of the target repository.'),
        name: z.string().min(1).describe('Repository name (shown to the AI).'),
        description: z
          .string()
          .min(1)
          .describe('Repository description (shown to the AI).'),
      })
      .describe('Repository context the AI generates against.'),
    inputs: z.array(GenerateInputItem).min(1).describe(
      'Ordered list of generation steps; processed in sequence.',
    ),
  })
  .describe('Payload for AI content generation.');

export type GenerateInput = z.infer<typeof GenerateInput>;
