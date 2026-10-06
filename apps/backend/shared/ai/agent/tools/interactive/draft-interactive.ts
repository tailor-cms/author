import { oneLine, stripIndent } from 'common-tags';

import {
  describeStartupCheck,
  findInteractive,
  loadDraft,
} from './helpers.ts';
import { isToolError, toolError, type ToolError } from '../helpers/index.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { stripResizeReporter } from './resize-reporter.ts';
import {
  draftStore,
  type InteractiveDraft,
  type NewDraft,
} from './drafts.ts';
import {
  extractStorageKey,
  isStorageAsset,
} from '#shared/storage/helpers.js';
import {
  inspectPage,
  LIBRARY_HOSTS,
  unbundlePage,
} from '../../../sandbox/index.ts';
import Storage from '#storage';

const TOOL = 'draft_interactive';

// After the page is loaded and watched this long for errors.
const STARTUP_ERROR_WINDOW_MS = 400;

// A reopened page is returned to the model only up to this size, to keep
// a large page from filling its context.
const MAX_RETURNED_HTML_BYTES = 120 * 1024;
const MAX_HTML_BYTES = 400 * 1024;

interface TextEdit {
  find: string;
  replace: string;
}

interface Input {
  draftId?: string | null;
  title?: string | null;
  html?: string | null;
  edits?: TextEdit[] | null;
  fromElementId?: number | null;
}

const description = stripIndent`
  Write or edit the HTML of an INTERACTIVE content element: one
  self-contained HTML file (markup, CSS and JS together) holding a
  visualization, simulation or explorable. The HTML is kept as a draft
  outside the repository until save_interactive stores it. Modes:
  - New draft: pass title + html (one complete HTML document).
  - Edit a draft: pass draftId + edits (exact find/replace pairs, each
    "find" must match once) or draftId + html to replace it all. Prefer
    edits for small fixes.
  - Work on an existing INTERACTIVE element: pass fromElementId. Alone,
    it reopens the element's stored HTML file for editing. With title +
    html, it writes that element's HTML from scratch - use this for an
    empty element (e.g. one the user just added and focused) or a
    complete rewrite. Either way saving updates that element.
  Every write is followed by a startup check (startupCheck): the HTML is
  loaded briefly and errors on load are reported. Use test_interactive
  for screenshots and interaction checks.
  HTML rules:
  - One complete document with its data inside; no calls to APIs.
    Libraries only from ${LIBRARY_HOSTS.join(', ')}; fonts only from
    Google Fonts; always with pinned versions. Prefer classic
    <script src> builds: saving copies them into the page, so it keeps
    working if the CDN goes away. ES modules (import ... from, e.g.
    esm.sh) keep loading from the CDN. Plain JS, SVG or Canvas is fine
    for simple pieces.
  - It runs in a sandbox: no localStorage, cookies, alerts or pop-ups;
    keep state in memory.
  - Fluid width; on narrow screens stack instead of squeezing, and avoid
    inner scrolling (the frame grows to fit the content).
  - Accessible: a <title>, visible labels on controls, keyboard
    operable, readable contrast, honors prefers-reduced-motion.
  - Teach one idea clearly: a short caption or legend, sensible
    defaults, visible feedback to every input.
`;

const parameters = {
  type: 'object',
  properties: {
    draftId: {
      type: ['string', 'null'],
      description: 'Draft to edit. Omit to start a new draft.',
    },
    title: {
      type: ['string', 'null'],
      description: 'Short title of the page; required for a new draft.',
    },
    html: {
      type: ['string', 'null'],
      description: 'Complete HTML document (new draft or full replace).',
    },
    edits: {
      type: ['array', 'null'],
      description: 'Find/replace pairs applied in order to the draft.',
      items: {
        type: 'object',
        properties: {
          find: { type: 'string', description: 'Exact text to replace.' },
          replace: { type: 'string', description: 'Replacement text.' },
        },
        required: ['find', 'replace'],
        additionalProperties: false,
      },
    },
    fromElementId: {
      type: ['integer', 'null'],
      description: oneLine`
        INTERACTIVE element the draft belongs to; add title + html to
        write its page from scratch (required when it is empty).
      `,
    },
  },
  additionalProperties: false,
};

async function execute(input: Input, ctx: ToolContext) {
  const { fromElementId, html } = input;
  if (fromElementId && !html) return reopenElement(fromElementId, input, ctx);
  const draft = await resolveDraft(input, ctx);
  if (isToolError(draft)) return draft;
  return describeDraft(draft);
}

async function describeDraft(draft: InteractiveDraft, isLoaded = false) {
  return {
    ok: true,
    draftId: draft.id,
    title: draft.title,
    elementId: draft.elementId,
    bytes: Buffer.byteLength(draft.html),
    lines: draft.html.split('\n').length,
    ...(isLoaded && describeLoadedHtml(draft.html)),
    startupCheck: await checkStartup(draft.html),
  };
}

function resolveDraft(input: Input, ctx: ToolContext) {
  const { fromElementId, draftId, title, html } = input;
  if (fromElementId) return writeElementHtml(fromElementId, input, ctx);
  if (draftId) return editDraft(draftId, input, ctx);
  if (!title || !html) {
    return toolError({
      tool: TOOL,
      reason: 'missing_input',
      message: 'A new draft needs both title and html.',
    });
  }
  return createDraft(ctx, { title, html, elementId: null });
}

async function editDraft(id: string, input: Input, ctx: ToolContext) {
  const draft = await loadDraft(TOOL, id, ctx);
  if (isToolError(draft)) return draft;
  const html = input.html ?? draft.html;
  const edited = input.edits?.length ? applyEdits(html, input.edits) : { html };
  if (isToolError(edited)) return edited;
  const sizeError = checkSize(edited.html);
  if (sizeError) return sizeError;
  draft.html = edited.html;
  if (input.title) draft.title = input.title;
  await draftStore.save(ctx, draft);
  return draft;
}

/**
 * Applies find/replace edits in order
 */
function applyEdits(html: string, edits: TextEdit[]): { html: string } | ToolError {
  let result = html;
  for (const [index, { find, replace }] of edits.entries()) {
    const count = find ? result.split(find).length - 1 : 0;
    if (count !== 1) {
      return toolError({
        tool: TOOL,
        reason: count ? 'edit_not_unique' : 'edit_not_found',
        message: count
          ? `Edit #${index}: "find" matches ${count} places; include more context.`
          : `Edit #${index}: "find" text not found in the draft.`,
        editIndex: index,
      });
    }
    result = result.replace(find, () => replace);
  }
  return { html: result };
}

function checkSize(html: string): ToolError | null {
  const bytes = Buffer.byteLength(html);
  if (bytes <= MAX_HTML_BYTES) return null;
  return toolError({
    tool: TOOL,
    reason: 'too_large',
    message: oneLine`
      The HTML is ${Math.round(bytes / 1024)}KB; the limit is
      ${MAX_HTML_BYTES / 1024}KB. Load libraries from a CDN instead of
      pasting them, and generate data in code rather than as literals.
    `,
  });
}

async function createDraft(ctx: ToolContext, data: NewDraft) {
  const sizeError = checkSize(data.html);
  if (sizeError) return sizeError;
  return draftStore.create(ctx, data);
}

// New HTML for an existing element
async function writeElementHtml(
  elementId: number,
  input: Input,
  ctx: ToolContext,
) {
  const element = await findInteractive(TOOL, elementId, ctx);
  if (isToolError(element)) return element;
  const title = titleOf(element, input);
  return createDraft(ctx, { title, html: input.html!, elementId });
}

/**
 * Opens the HTML an element already has as a draft. An element that
 * never had HTML (just added, then focused with "make a simulation") is
 * not an error.
 */
async function reopenElement(
  elementId: number,
  input: Input,
  ctx: ToolContext,
) {
  const element = await findInteractive(TOOL, elementId, ctx);
  if (isToolError(element)) return element;
  const storedUri = element.data?.assets?.url;
  if (!storedUri) return describeEmptyElement(elementId);
  const html = await readStoredPage(storedUri);
  if (html === null) {
    return toolError({
      tool: TOOL,
      reason: 'file_missing',
      message: oneLine`
        The HTML file of element #${elementId} can't be read. Write it
        again: call draft_interactive with fromElementId: ${elementId},
        title and html.
      `,
    });
  }
  const title = titleOf(element, input);
  const draft = await draftStore.create(ctx, { title, html, elementId });
  return describeDraft(draft, true);
}

function describeEmptyElement(elementId: number) {
  return {
    ok: true,
    elementId,
    isEmpty: true,
    next: oneLine`
      Element #${elementId} has no HTML yet. Write it: call
      draft_interactive with fromElementId: ${elementId}, title and html;
      saving then fills this element.
    `,
  };
}

const titleOf = (element: any, input: Input): string =>
  input.title || element.data?.title || `Interactive #${element.id}`;

async function readStoredPage(uri?: string | null): Promise<string | null> {
  if (!isStorageAsset(uri)) return null;
  const buffer = await Storage.getFile(extractStorageKey(uri));
  if (!buffer) return null;
  return stripResizeReporter(unbundlePage(buffer.toString('utf8')));
}

function describeLoadedHtml(html: string) {
  if (Buffer.byteLength(html) <= MAX_RETURNED_HTML_BYTES) return { html };
  return {
    note: oneLine`
      The page is too large to show. To change it, write it again in full:
      call draft_interactive with this draftId and html.
    `,
  };
}

async function checkStartup(html: string) {
  try {
    const report = await inspectPage({ html, settleMs: STARTUP_ERROR_WINDOW_MS });
    return describeStartupCheck(report);
  } catch (err: any) {
    return { skipped: `Page could not be run: ${err.message}` };
  }
}

export const draft_interactive: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};
