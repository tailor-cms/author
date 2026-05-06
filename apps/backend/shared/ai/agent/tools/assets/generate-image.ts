import { oneLine, stripIndent } from 'common-tags';
import OpenAI from 'openai';
import mime from 'mime-types';
import { ai as aiConfig } from '#config';
import db from '#shared/database/index.js';
import Storage from '#storage';
import * as assetService from '../../../../../asset/asset.service.ts';
import { createAiLogger } from '../../../logger.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { recordOperation, toolError } from '../helpers/index.ts';

const logger = createAiLogger('agent.tools.assets');
const { Asset } = db as any;
const TOOL = 'generate_image_asset';

let openaiClient: OpenAI | null = null;

interface Input {
  prompt: string;
  referenceAssetId?: number | null;
  name?: string | null;
  size?: string | null;
  quality?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

const description = stripIndent`
  Generate an image with OpenAI and add it to the repository
  asset library. Optionally pass referenceAssetId to use an
  existing library image as style/content inspiration - the
  generated image will incorporate the reference's visual
  features. ALWAYS check list_assets first to see if a
  suitable image already exists. After generating, you can:
  - Pass the asset id in assetIds to generate_container_content
    so the AI inserts it as an IMAGE element in generated content
  - Use attach_asset_to_activity to set it on a FILE meta
    field (e.g. thumbnail, hero image)
  - Use add_elements_to_activity to add it as an IMAGE
    element directly into an existing section
`;

const parameters = {
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
      description: oneLine`
        Visual prompt describing the image. Focus on subject,
        composition, style, mood, and color palette. Avoid
        text or lettering - image models render text poorly.
      `,
    },
    referenceAssetId: {
      type: ['integer', 'null'],
      description: oneLine`
        Asset id of an existing library image to use as
        inspiration. The generated image will match the
        reference's style and visual features. Call
        list_assets to find a suitable reference first.
      `,
    },
    name: {
      type: ['string', 'null'],
      description: 'Display name for the asset (without extension).',
    },
    size: {
      type: ['string', 'null'],
      enum: ['1024x1024', '1024x1536', '1536x1024', null],
      description: oneLine`
        Image dimensions. Defaults to 1536x1024 (landscape,
        fits typical learning app content width). Use
        1024x1024 for square icons, 1024x1536 for tall cards.
      `,
    },
    quality: {
      type: ['string', 'null'],
      enum: ['low', 'medium', 'high', 'auto', null],
      description: oneLine`
        Image quality. Defaults to auto. Use low for fast
        previews, high for final assets.
      `,
    },
    description: {
      type: ['string', 'null'],
      description: oneLine`
        Alt text or caption for accessibility. Also used
        as context when indexing for vector store search.
      `,
    },
    tags: {
      type: ['array', 'null'],
      items: { type: 'string' },
      description: 'Tags for categorization and search.',
    },
  },
  required: ['prompt'],
  additionalProperties: false,
};

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: aiConfig.secretKey });
  }
  return openaiClient;
}

// Sanitize a raw name into a safe PNG filename.
function sanitizeFilename(rawName?: string | null): string {
  const base = (rawName || `ai-${Date.now()}`)
    .replace(/[^a-z0-9_-]/gi, '-')
    .slice(0, 80);
  return `${base}.png`;
}

// Read a reference asset from storage and return as a base64
// data URL. We use base64 instead of the signed public URL
// because in dev the URL points to localhost which OpenAI
// can't reach.
async function resolveReferenceDataUrl(
  assetId: number,
  ctx: ToolContext,
): Promise<{ dataUrl: string } | { error: string; message: string }> {
  const asset = await Asset.findOne({
    where: { id: assetId, repositoryId: ctx.repository.id },
  });
  if (!asset) {
    return toolError({
      tool: TOOL,
      reason: 'reference_not_found',
      message: `Reference asset #${assetId} not found.`,
    });
  }
  if (!asset.storageKey) {
    return toolError({
      tool: TOOL,
      reason: 'reference_no_file',
      message: `Asset #${assetId} has no stored file.`,
    });
  }
  try {
    const buffer = await Storage.getFile(asset.storageKey);
    if (!buffer) {
      return toolError({
        tool: TOOL,
        reason: 'reference_missing',
        message: `File for asset #${assetId} not found in storage.`,
      });
    }
    const mimeType = mime.lookup(asset.storageKey) || 'image/png';
    return {
      dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
    };
  } catch (err: any) {
    return toolError({
      tool: TOOL,
      reason: 'reference_read_failed',
      message: err.message,
    });
  }
}

// Generate via images.generate (no reference image).
async function generateDirect(input: Input) {
  const client = getClient();
  const size = input.size || '1536x1024';
  const quality = input.quality || 'auto';
  logger.info(
    {
      model: aiConfig.imageModelId,
      size,
      quality,
      prompt: input.prompt,
    },
    'generating image',
  );
  const response = await client.images.generate({
    model: aiConfig.imageModelId,
    prompt: input.prompt,
    size: size as any,
    quality: quality as any,
  });
  const item = response?.data?.[0];
  if (!item?.b64_json) {
    return toolError({
      tool: TOOL,
      reason: 'no_image_data',
      message: 'No image data in API response.',
    });
  }
  const revisedPrompt: string | null = (item as any).revised_prompt || null;
  return { data: Buffer.from(item.b64_json, 'base64'), revisedPrompt };
}

// Generate via Responses API with a reference image as input.
// Uses the regular LLM model with the image_generation tool -
// the model sees the reference image and generates based on it.
async function generateWithReference(input: Input, referenceDataUrl: string) {
  const client = getClient();
  logger.info(
    { model: aiConfig.modelId, prompt: input.prompt },
    'generating image with reference',
  );
  const response = await (client as any).responses.create({
    model: aiConfig.modelId,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: input.prompt },
          { type: 'input_image', image_url: referenceDataUrl },
        ],
      },
    ],
    tools: [{ type: 'image_generation' }],
  });
  const imageOutput = response?.output?.find(
    (item: any) => item.type === 'image_generation_call',
  );
  if (!imageOutput?.result) {
    return toolError({
      tool: TOOL,
      reason: 'no_image_data',
      message: 'No image data in Responses API output.',
    });
  }
  return {
    data: Buffer.from(imageOutput.result, 'base64'),
    revisedPrompt: null,
  };
}

async function execute(input: Input, ctx: ToolContext) {
  if (!aiConfig.isEnabled) {
    return toolError({
      tool: TOOL,
      reason: 'not_configured',
      message: 'AI is not configured.',
    });
  }

  let buffer: any;
  try {
    if (input.referenceAssetId) {
      const ref = await resolveReferenceDataUrl(input.referenceAssetId, ctx);
      if ('error' in ref) return ref;
      buffer = await generateWithReference(input, ref.dataUrl);
    } else {
      buffer = await generateDirect(input);
    }
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'generation_failed',
      message: error.message,
    });
  }
  if ('error' in buffer) return buffer;

  const file = {
    buffer: buffer.data,
    originalname: sanitizeFilename(input.name),
    mimetype: 'image/png',
    size: buffer.data.length,
  };

  let asset: any;
  try {
    const [uploaded] = await assetService.upload(
      ctx.repository.id,
      ctx.userId,
      [file] as any,
    );
    asset = uploaded;
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'upload_failed',
      message: error.message,
    });
  }

  // Enrich asset with meaningful name and metadata
  const promptText = buffer.revisedPrompt || input.prompt;
  try {
    await asset.update({
      name: input.name || promptText.slice(0, 100),
      meta: {
        ...asset.meta,
        description: input.description || promptText.slice(0, 240),
        tags: input.tags || ['ai-generated'],
      },
    });
  } catch {
    // Non-critical - asset is created, enrichment failed
  }

  let publicUrl: string | undefined;
  try {
    const download = await assetService.getDownloadUrl(asset.storageKey);
    publicUrl = download.publicUrl;
  } catch {
    // non-critical
  }

  const result = {
    ok: true,
    id: asset.id,
    name: asset.name,
    type: asset.type,
    storageKey: asset.storageKey,
    publicUrl: publicUrl || null,
    isIndexed: false,
    meta: asset.meta || {},
    ...(input.referenceAssetId
      ? { referenceAssetId: input.referenceAssetId }
      : {}),
    _invalidates: ['assets'],
  };
  recordOperation(TOOL, input, result, ctx);
  return result;
}

export const generate_image_asset: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};
