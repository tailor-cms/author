// Wire shape for the seed-repository endpoint.
import { z } from 'zod';
import { Email } from '#shared/request/schemas.ts';

export const RepositoryInput = z
  .object({
    name: z
      .string()
      .optional()
      .describe('Repository name; faker-generated when absent.'),
    description: z.string().optional().describe('Repository description.'),
    authorEmail: Email()
      .nullable()
      .optional()
      .describe('Email of an existing user to attribute the import to.'),
    includeLinkExample: z
      .boolean()
      .optional()
      .describe('Also create a linked content example for the seeded repo.'),
  })
  .describe(
    'Optional fields for seeding a repository from the fixture archive.',
  );

export type RepositoryInput = z.infer<typeof RepositoryInput>;
