import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { oneLine } from 'common-tags';

import {
  type InspectReport,
  BrowserUnavailableError,
  LIBRARY_HOSTS,
} from '../../../sandbox/index.ts';
import type { InlineImagesResult } from './images.ts';
import type { ToolContext } from '../types.ts';
import { DRAFT_TTL_DAYS, draftStore, type InteractiveDraft } from './drafts.ts';
import { toolError, type ToolError } from '../helpers/index.ts';
import { findElement } from '../content-elements/helpers.ts';
import { isStorageAsset } from '#shared/storage/helpers.js';

export const ELEMENT_TYPE = ContentElementType.Interactive;

export async function loadDraft(
  tool: string,
  id: string,
  ctx: ToolContext,
): Promise<InteractiveDraft | ToolError> {
  const draft = await draftStore.get(ctx, id);
  if (draft) return draft;
  return toolError({
    tool,
    reason: 'draft_not_found',
    message: oneLine`
      Draft "${id}" not found (drafts expire after ${DRAFT_TTL_DAYS} days).
      Start a new one with draft_interactive, or reopen a saved element's
      HTML with fromElementId.
    `,
  });
}

export async function findInteractive(
  tool: string,
  elementId: number,
  ctx: ToolContext,
) {
  const element = await findElement(elementId, ctx);
  if (element?.type === ELEMENT_TYPE) return element;
  return toolError({
    tool,
    reason: 'element_not_found',
    message: `No ${ELEMENT_TYPE} element #${elementId} in this repository.`,
  });
}

// Turns a failed sandbox run (no browser, crash) into a tool error.
export function sandboxError(tool: string, err: unknown): ToolError {
  if (err instanceof BrowserUnavailableError) {
    return toolError({
      tool,
      reason: 'sandbox_unavailable',
      message: oneLine`
        The test browser is not available (${err.message}). Tell the user
        the HTML can't be tested right now; an administrator needs to set
        up the test browser.
      `,
    });
  }
  return toolError({
    tool,
    reason: 'sandbox_failed',
    message: (err as Error)?.message ?? 'Test run failed.',
  });
}

/**
 * Joins the page run with the image step. Library images that could not
 * be copied fail the run and are reported as imageErrors.
 */
function mergeImageResult(report: InspectReport, images: InlineImagesResult) {
  const blockedRequests = report.blockedRequests.filter(
    (url) => !isStorageAsset(url),
  );
  const ok = report.isLoaded && !report.errors.length && !images.failed.length;
  return { ok, report: { ...report, blockedRequests } };
}

// Full outcome for test_interactive; screenshots go out as images.
export function describeTestReport(
  inspected: InspectReport,
  images: InlineImagesResult,
) {
  const { ok, report } = mergeImageResult(inspected, images);
  const { screenshots, ...rest } = report;
  const hints = collectHints(report);
  return {
    ok,
    ...rest,
    ...(screenshots.length && {
      screenshots: screenshots.map((it) => it.label),
    }),
    ...describeImages(images),
    ...(hints.length && { hints }),
  };
}

// Short outcome of the startup check that follows every draft write.
export function describeStartupCheck(
  inspected: InspectReport,
  images: InlineImagesResult,
) {
  const { ok, report } = mergeImageResult(inspected, images);
  const { isLoaded, errors, blockedRequests, failedRequests, metrics } = report;
  return {
    ok,
    ...(!isLoaded && { isLoaded }),
    errors,
    ...(blockedRequests.length && { blockedRequests }),
    ...(failedRequests.length && { failedRequests }),
    ...(metrics?.isLikelyBlank && { isLikelyBlank: true }),
    ...describeImages(images),
  };
}

// Library images that could not be copied in, and ones copied many times.
function describeImages({ failed, repeated }: InlineImagesResult) {
  return {
    ...(failed.length && { imageErrors: failed }),
    ...(repeated.length && {
      repeatedImages: repeated,
      imageHint: oneLine`
        Each time an image's storage URL is written, the page gets a full
        copy. Write it once (a CSS class or a JS variable) and reuse that.
      `,
    }),
  };
}

function collectHints({ metrics, blockedRequests }: InspectReport) {
  const hints: string[] = [];
  if (metrics?.isLikelyBlank) {
    hints.push(oneLine`
      Nothing visible was rendered - usually a script failed before
      drawing; check errors.
    `);
  }
  if (metrics?.hasHorizontalOverflow) {
    hints.push(oneLine`
      Content is wider than the viewport and will scroll sideways in the
      element; make the layout fluid (width: 100%, max-width, flex-wrap).
    `);
  }
  if (blockedRequests.length) {
    hints.push(oneLine`
      Blocked requests fail for readers too. Put data in the HTML and load
      libraries only from: ${LIBRARY_HOSTS.join(', ')} (fonts: Google
      Fonts).
    `);
  }
  return hints;
}
