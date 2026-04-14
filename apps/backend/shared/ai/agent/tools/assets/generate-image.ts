import { oneLine, stripIndent } from 'common-tags';
import OpenAI from 'openai';
import { ai as aiConfig } from '#config';
import * as assetService from '../../../../../asset/asset.service.ts';
import { createAiLogger } from '../../../logger.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { recordOperation, toolError } from '../helpers/index.ts';

const logger = createAiLogger('agent.tools.assets');
const TOOL = 'generate_image_asset';

let openaiClient: OpenAI | null = null;

interface Input {
  prompt: string;
  name?: string | null;
  size?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

const description = stripIndent`
  Generate an image with OpenAI and add it to the repository
  asset library. ALWAYS check list_assets first to see if a
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
    name: {
      type: ['string', 'null'],
      description: 'Display name for the asset (without extension).',
    },
    size: {
      type: ['string', 'null'],
      enum: [
        '1024x1024',
        '1024x1536',
        '1536x1024',
        '1792x1024',
        '1024x1792',
        null,
      ],
      description: oneLine`
        Image dimensions. Defaults to 1536x1024 (landscape,
        fits typical learning app content width). Use
        1024x1024 for square icons, 1024x1536 for tall cards.
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

/**
 * Return a lazily-initialized OpenAI client.
 */
function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: aiConfig.secretKey,
    });
  }
  return openaiClient;
}

/**
 * Sanitize a raw name into a safe PNG filename.
 * Strips special characters, limits to 80 chars,
 * and falls back to a timestamped name if empty.
 */
function sanitizeFilename(rawName?: string | null): string {
  const base = (rawName || `ai-${Date.now()}`)
    .replace(/[^a-z0-9_-]/gi, '-')
    .slice(0, 80);
  return `${base}.png`;
}

/**
 * Call the OpenAI image generation API and return
 * a buffer with the generated PNG data.
 */
async function generateBuffer(input: Input) {
  const client = getClient();
  // Landscape default - slightly wider than typical 1200-1440px
  // container max-width so images scale down cleanly
  const size = input.size || '1536x1024';
  logger.info(
    {
      model: aiConfig.imageModelId,
      size,
      prompt: input.prompt.slice(0, 120),
    },
    'generating image',
  );

  let response: any;
  try {
    response = await client.images.generate({
      model: aiConfig.imageModelId,
      prompt: input.prompt,
      size,
      n: 1,
    } as any);
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'generation_failed',
      message: error.message,
    });
  }

  const item = response?.data?.[0];
  if (!item) {
    return toolError({
      tool: TOOL,
      reason: 'no_image_data',
      message: 'No image data in API response.',
    });
  }

  // OpenAI may return a revised_prompt - an expanded/improved
  // version of the input prompt. More descriptive than the
  // original, useful for asset naming and description.
  const revisedPrompt: string | null = item.revised_prompt || null;

  // Image data comes in one of two formats:
  // - b64_json: base64-encoded PNG (inline, no fetch needed)
  // - url: temporary signed URL (expires ~1h, must download)
  if (item.b64_json) {
    return { data: Buffer.from(item.b64_json, 'base64'), revisedPrompt };
  }
  if (item.url) {
    const fetchResponse = await fetch(item.url);
    const arrayBuffer = await fetchResponse.arrayBuffer();
    return { data: Buffer.from(arrayBuffer), revisedPrompt };
  }
  return toolError({
    tool: TOOL,
    reason: 'no_payload',
    message: 'Could not decode image from API response.',
  });
}

/**
 * Generate an image via OpenAI and import it into the
 * repository asset library. Returns the created asset
 * with a signed public URL for preview.
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!aiConfig.isEnabled) {
    return toolError({
      tool: TOOL,
      reason: 'not_configured',
      message: 'AI is not configured.',
    });
  }

  const buffer = await generateBuffer(input);
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

  // Enrich asset with meaningful name and metadata.
  // upload() sets name from filename (ai-12345.png) -
  // override with user name, revised prompt from OpenAI
  // (expanded/improved), or truncated input prompt.
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
    /* non-critical */
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
