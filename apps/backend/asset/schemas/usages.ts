import { z } from 'zod';

export const AssetUsage = z
  .object({
    type: z
      .enum(['element', 'activity', 'repository'])
      .describe('Kind of entity referencing the asset.'),
    repositoryName: z
      .string()
      .optional()
      .describe('Repository name (repository-meta usages).'),
    activityId: z
      .number()
      .int()
      .optional()
      .describe('Outline activity to show (element & activity usages).'),
    activityName: z
      .string()
      .nullable()
      .optional()
      .describe('Display name of the activity.'),
    elementUid: z
      .string()
      .optional()
      .describe(
        'Element uid; used to focus it in the editor (element usages).',
      ),
    elementType: z
      .string()
      .optional()
      .describe('Content element type, e.g. IMAGE (element usages).'),
  })
  .meta({ id: 'AssetUsage' })
  .describe('A single place an asset is referenced.');

export type AssetUsage = z.infer<typeof AssetUsage>;

export const AssetUsages = z
  .array(AssetUsage)
  .meta({ id: 'AssetUsages' })
  .describe('Everywhere an asset is referenced within its repository.');

export type AssetUsages = z.infer<typeof AssetUsages>;
