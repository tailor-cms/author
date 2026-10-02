import { oneLine, stripIndent } from 'common-tags';

import {
  bundlePage,
  type BundleResult,
  inspectPage,
} from '../../../sandbox/index.ts';
import {
  ELEMENT_TYPE,
  findInteractive,
  loadDraft,
  sandboxError,
} from './helpers.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { isToolError, toolError } from '../helpers/index.ts';
import { pickElementFields } from '../content-elements/helpers.ts';
import { createAiLogger } from '../../../logger.ts';
import { draftStore, type InteractiveDraft } from './drafts.ts';
import { addResizeReporter } from './resize-reporter.ts';
import { resolveElementHost } from '../activity/helpers.ts';
import { add_elements_to_activity } from '../content-elements/add-elements.ts';
import { update_element } from '../content-elements/update-element.ts';
import { storage as storageConfig } from '#config';
import * as assetService from '../../../../../asset/asset.service.ts';

const logger = createAiLogger('agent.tools.interactive');

const TOOL = 'save_interactive';

const ASSET_TAGS = ['interactive', 'ai-generated'];

// Defaults, before reporting from the page.
const DEFAULT_HEIGHT = 480;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 2000;

const clampHeight = (height: number): number =>
  Math.min(Math.max(Math.round(height), MIN_HEIGHT), MAX_HEIGHT);

interface Input {
  draftId: string;
  activityId?: number | null;
  elementId?: number | null;
  title?: string | null;
  description?: string | null;
  height?: number | null;
  inlineLibraries?: boolean | null;
}

const description = stripIndent`
  Store a tested draft as an INTERACTIVE content element: its HTML is
  saved as one file in the asset library and the element points to it.
  CDN libraries are inlined first so the stored HTML works offline;
  the result is re-run with the network off and saving stops if it
  breaks. Target: elementId to update an existing INTERACTIVE element
  (a reopened draft updates its element by default), or activityId of
  the host (container / subcontainer) to append a new element. The host
  must allow INTERACTIVE - check get_schema_info.
`;

const parameters = {
  type: 'object',
  properties: {
    draftId: { type: 'string', description: 'Draft to save.' },
    activityId: {
      type: ['integer', 'null'],
      description: 'Host to append a new element to.',
    },
    elementId: {
      type: ['integer', 'null'],
      description: 'INTERACTIVE element to update instead.',
    },
    title: {
      type: ['string', 'null'],
      description: 'Title shown to assistive tech; defaults to the draft title.',
    },
    description: {
      type: ['string', 'null'],
      description: 'One-sentence text alternative describing what it shows.',
    },
    height: {
      type: ['integer', 'null'],
      description: oneLine`
        Frame height in px (${MIN_HEIGHT}-${MAX_HEIGHT}): the height the
        page needs at desktop width. It is the minimum; the frame grows
        when the content gets taller (e.g. on narrow screens).
      `,
    },
    inlineLibraries: {
      type: ['boolean', 'null'],
      description: oneLine`
        Copy CDN libraries into the saved HTML so it works without the CDN
        (default true). Set false only when saving fails its offline check
        because a library loads more files on its own (ES modules with
        imports, web workers, wasm): copying the main file can't bring
        those along. The saved HTML then loads its libraries from the CDN.
      `,
    },
  },
  required: ['draftId'],
  additionalProperties: false,
};

async function execute(input: Input, ctx: ToolContext) {
  const draft = await loadDraft(TOOL, input.draftId, ctx);
  if (isToolError(draft)) return draft;
  const target = await resolveTarget(input, draft, ctx);
  if (isToolError(target)) return target;

  const page = await preparePage(draft.html, input.inlineLibraries !== false);
  if (isToolError(page)) return page;

  const title = input.title || draft.title;
  const textAlternative =
    input.description ?? target.element?.data?.description ?? '';

  const html = addResizeReporter(page.html);

  const { storageKey, storageUri } = await storePage(
    html,
    { title, description: textAlternative || title },
    ctx,
  );
  const data = {
    title,
    description: textAlternative,
    height: clampHeight(
      input.height ?? target.element?.data?.height ?? DEFAULT_HEIGHT,
    ),
    url: storageUri,
    assets: { url: storageUri },
  };
  const saved = target.element
    ? await updateElement(target.element, data, ctx)
    : await createElement(target.host, data, ctx);
  if (isToolError(saved)) return saved;

  draft.elementId = saved.id;
  await draftStore.save(ctx, draft);
  await dropSessionVersion(saved.id, storageKey, ctx);
  return {
    ok: true,
    element: pickElementFields(saved),
    isUpdate: !!target.element,
    bundle: describeBundle(page.bundle),
    _invalidates: [
      `element:${saved.id}`,
      `activity:${saved.activityId}`,
      'assets',
    ],
  };
}

type Target = { element: any; host?: never } | { element?: never; host: any };

async function resolveTarget(
  input: Input,
  draft: InteractiveDraft,
  ctx: ToolContext,
): Promise<Target | ReturnType<typeof toolError>> {
  // A reopened draft updates its element unless a new host is given.
  const elementId =
    input.elementId ?? (input.activityId ? null : draft.elementId);
  if (elementId) {
    const element = await findInteractive(TOOL, elementId, ctx);
    return isToolError(element) ? element : { element };
  }
  if (!input.activityId) {
    return toolError({
      tool: TOOL,
      reason: 'missing_target',
      message: 'Pass activityId (new element) or elementId (update).',
    });
  }
  const resolved = await resolveElementHost(TOOL, input.activityId, ctx);
  if (isToolError(resolved)) return resolved;
  const { host, allowedTypes } = resolved;
  if (allowedTypes.includes(ELEMENT_TYPE)) return { host };
  return toolError({
    tool: TOOL,
    reason: 'type_not_allowed',
    message: oneLine`
      ${host.type} #${host.id} does not allow ${ELEMENT_TYPE} elements.
      Tell the user the schema has to enable it for this container.
    `,
    allowedElementTypes: allowedTypes,
  });
}

/**
 * Inline libraries and prove the result runs without network.
 */
async function preparePage(html: string, isInlining: boolean) {
  if (!isInlining) return { html, bundle: null };
  const bundle = await bundlePage(html);
  if (!bundle.inlined.length) return { html, bundle };
  try {
    const report = await inspectPage({ html: bundle.html, isOffline: true });
    if (!report.errors.length) return { html: bundle.html, bundle };
    return toolError({
      tool: TOOL,
      reason: 'offline_check_failed',
      message: oneLine`
        With libraries inlined and the network off, the page fails. Fix
        it (prefer classic <script src> builds of libraries) or save with
        inlineLibraries: false.
      `,
      errors: report.errors,
      blockedRequests: report.blockedRequests,
    });
  } catch (err) {
    return sandboxError(TOOL, err);
  }
}

async function storePage(
  html: string,
  { title, description }: { title: string; description: string },
  ctx: ToolContext,
): Promise<{ storageKey: string; storageUri: string }> {
  const buffer = Buffer.from(html, 'utf8');
  const asset = await assetService.importBufferedFile({
    repositoryId: ctx.repository.id,
    userId: ctx.userId,
    file: {
      buffer,
      originalname: `${toFileName(title)}.html`,
      mimetype: 'text/html',
      size: buffer.length,
    },
    description,
    tags: ASSET_TAGS,
  });
  const storageKey = asset.storageKey!;
  return { storageKey, storageUri: `${storageConfig.protocol}${storageKey}` };
}

/**
 * Each save stores a new file, so re-saving in one session would pile up
 * library entries for the same element.
 */
async function dropSessionVersion(
  elementId: number,
  storageKey: string,
  ctx: ToolContext,
) {
  try {
    const previousKey = await draftStore.replaceSavedFile(
      ctx,
      elementId,
      storageKey,
    );
    if (!previousKey || previousKey === storageKey) return;
    const [previous] = await assetService.findByStorageKeys([previousKey]);
    if (previous?.repositoryId !== ctx.repository.id) return;
    const usages = await assetService.findUsages(ctx.repository, previous);
    if (usages.length) return;
    await assetService.remove(ctx.repository, previous);
  } catch (err) {
    // Housekeeping only; the save itself already succeeded.
    logger.warn({ err, elementId }, 'Could not drop the previous version');
  }
}

// Elements are created and updated through the regular element tools, so
// both are logged and normalized the same way as any other edit.
async function createElement(host: any, data: any, ctx: ToolContext) {
  const result = await add_elements_to_activity.execute(
    { activityId: host.id, elements: [{ type: ELEMENT_TYPE, data }] },
    ctx,
  );
  if (isToolError(result)) return result;
  const [element] = result.elements;
  if (element) return element;
  return toolError({
    tool: TOOL,
    reason: 'create_failed',
    message: result.failed?.[0]?.reason ?? 'Element could not be created.',
  });
}

async function updateElement(element: any, data: any, ctx: ToolContext) {
  const result = await update_element.execute({ id: element.id, data }, ctx);
  return isToolError(result) ? result : result.element;
}

function toFileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return slug.replace(/^-|-$/g, '').slice(0, 60) || 'interactive';
}

function describeBundle(bundle: BundleResult | null) {
  if (!bundle) return { isInlined: false };
  return {
    isInlined: true,
    inlined: bundle.inlined,
    ...(bundle.failed.length && { notInlined: bundle.failed }),
  };
}

export const save_interactive: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};
