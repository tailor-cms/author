import { oneLine, stripIndent } from 'common-tags';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  metaInputsForActivity,
  recordOperation,
  toolError,
} from '../helpers/index.ts';
import { findActivity } from './helpers.ts';

const { Asset } = db as any;

const TOOL = 'attach_asset_to_activity';

interface Input {
  activityId: number;
  assetId: number;
  metaKey?: string | null;
}

const description = stripIndent`
  Attach an asset to a FILE meta field on an activity
  (e.g. thumbnailImage, heroImage, posterImage). Works
  for any asset type - images, PDFs, videos, audio. Use
  after generate_image_asset, import_resource, or after
  picking an existing asset from list_assets. Call
  get_schema_info to see which meta fields are FILE type.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: 'Activity to attach the asset to.',
    },
    assetId: {
      type: 'integer',
      description: 'Asset id from the repository library.',
    },
    metaKey: {
      type: ['string', 'null'],
      description: oneLine`
        FILE meta field key to set. Omit to auto-pick
        the first FILE field on the activity type.
      `,
    },
  },
  required: ['activityId', 'assetId'],
  additionalProperties: false,
};

/**
 * Resolve FILE meta field keys for an activity type
 * from the schema. Returns all meta fields where
 * type === 'FILE'.
 */
function fileMetaKeys(activityType: string): string[] {
  const meta = metaInputsForActivity(activityType);
  return meta.filter((m: any) => m.type === 'FILE').map((m: any) => m.key);
}

/**
 * Attach an asset to a FILE meta field on the target
 * activity. Validates that the asset exists in the
 * repository and the meta key is a FILE field.
 */
async function execute(input: Input, ctx: ToolContext) {
  const activity = await findActivity(input.activityId, ctx);
  if (!activity) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.activityId} not found.`,
    });
  }
  const asset = await Asset.findByPk(input.assetId);
  if (!asset || asset.repositoryId !== ctx.repository.id) {
    return toolError({
      tool: TOOL,
      reason: 'asset_not_found',
      message: `Asset #${input.assetId} not found.`,
    });
  }
  const keys = fileMetaKeys(activity.type);
  if (!keys.length) {
    return toolError({
      tool: TOOL,
      reason: 'no_file_field',
      message: `"${activity.type}" has no FILE meta fields.`,
    });
  }

  const metaKey = input.metaKey || keys[0];
  if (!keys.includes(metaKey)) {
    return toolError({
      tool: TOOL,
      reason: 'invalid_meta_key',
      message: `"${metaKey}" is not a FILE meta field.`,
      allowedKeys: keys,
    });
  }
  const previousValue = activity.data?.[metaKey];
  await activity.update(
    {
      data: {
        ...activity.data,
        [metaKey]: {
          key: asset.storageKey,
          name: asset.name,
        },
      },
    },
    { context: dbContext(ctx) },
  );

  const result = {
    ok: true,
    activityId: activity.id,
    metaKey,
    asset: {
      id: asset.id,
      type: asset.type,
      name: asset.name,
      storageKey: asset.storageKey,
    },
    _invalidates: [`activity:${activity.id}`, 'outline'],
  };
  recordOperation(TOOL, input, result, ctx, {
    tool: 'update_activity',
    input: {
      id: activity.id,
      data: { [metaKey]: previousValue ?? null },
    },
  });
  return result;
}

export const attach_asset_to_activity: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};
