import { oneLine, stripIndent } from 'common-tags';

import {
  DEFAULT_SETTLE_MS,
  DEFAULT_VIEWPORT,
  inspectPage,
  type Interaction,
  INTERACTION_ACTIONS,
  MAX_INTERACTIONS,
  MAX_SCREENSHOTS,
  MAX_SETTLE_MS,
  MAX_WAIT_MS,
  type Viewport,
} from '../../../sandbox/index.ts';
import {
  describeReport,
  isToolError,
  loadDraft,
  runtimeError,
} from './helpers.ts';
import type { ToolContext, ToolDef } from '../types.ts';

const TOOL = 'test_interactive';

const MIN_VIEWPORT: Viewport = { width: 320, height: 200 };
const MAX_VIEWPORT: Viewport = { width: 1920, height: 1400 };

interface Input {
  draftId: string;
  viewport?: Partial<Viewport> | null;
  interactions?: Interaction[] | null;
  screenshot?: boolean | null;
  settleMs?: number | null;
}

const description = stripIndent`
  Run a draft's HTML in a headless browser the way readers will see it
  (same sandbox, no storage or cookies, network limited to library CDNs)
  and report: uncaught errors and console output with line numbers, blocked
  or failed requests, layout facts (size, overflow, blank page), results
  of your interactions with the page, and screenshots you receive as
  images. Interact with the page the way a reader would to check its
  behavior: click / hover / fill (inputs and sliders) / press (keys) /
  drag / wait / evaluate (a JS expression whose value is returned, e.g.
  reading state) / screenshot (at most ${MAX_SCREENSHOTS} per run,
  including the final one). Interactions stop at the first failure; each
  result counts the page errors it caused. Test at a phone width too
  (viewport 390x700) when layout matters.
`;

const interactionSchema = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: INTERACTION_ACTIONS },
    selector: {
      type: ['string', 'null'],
      description: 'CSS selector of the element to interact with.',
    },
    target: {
      type: ['string', 'null'],
      description: 'drag: selector to drop on.',
    },
    x: { type: ['number', 'null'], description: 'Viewport x without selector.' },
    y: { type: ['number', 'null'], description: 'Viewport y without selector.' },
    toX: { type: ['number', 'null'], description: 'drag: end x.' },
    toY: { type: ['number', 'null'], description: 'drag: end y.' },
    value: {
      type: ['string', 'null'],
      description: 'fill: text or value; press: key name, e.g. "ArrowRight".',
    },
    ms: {
      type: ['integer', 'null'],
      description: `wait: pause in ms, max ${MAX_WAIT_MS}.`,
    },
    expression: {
      type: ['string', 'null'],
      description: 'evaluate: JS expression; its JSON value is returned.',
    },
    label: { type: ['string', 'null'], description: 'screenshot: name.' },
  },
  required: ['action'],
  additionalProperties: false,
};

const parameters = {
  type: 'object',
  properties: {
    draftId: { type: 'string', description: 'Draft to run.' },
    viewport: {
      type: ['object', 'null'],
      description: oneLine`
        Browser size in CSS px. Defaults to
        ${DEFAULT_VIEWPORT.width}x${DEFAULT_VIEWPORT.height}; match the
        height you plan to save the element with.
      `,
      properties: {
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
      additionalProperties: false,
    },
    interactions: {
      type: ['array', 'null'],
      description: oneLine`
        What to do with the page after load, in order (max
        ${MAX_INTERACTIONS}).
      `,
      items: interactionSchema,
    },
    screenshot: {
      type: ['boolean', 'null'],
      description: 'Final screenshot (default true).',
    },
    settleMs: {
      type: ['integer', 'null'],
      description: oneLine`
        Wait after load before measuring, in ms (default
        ${DEFAULT_SETTLE_MS}, max ${MAX_SETTLE_MS}).
      `,
    },
  },
  required: ['draftId'],
  additionalProperties: false,
};

async function execute(input: Input, ctx: ToolContext) {
  const draft = await loadDraft(TOOL, input.draftId, ctx);
  if (isToolError(draft)) return draft;
  try {
    const report = await inspectPage({
      html: draft.html,
      viewport: resolveViewport(input.viewport),
      interactions: input.interactions ?? [],
      isScreenshotEnabled: input.screenshot !== false,
      settleMs: input.settleMs ?? undefined,
    });
    return {
      draftId: draft.id,
      ...describeReport(report),
      _images: report.screenshots,
    };
  } catch (err) {
    return runtimeError(TOOL, err);
  }
}

function resolveViewport(input?: Partial<Viewport> | null): Viewport {
  const clamp = (value: number | undefined, key: keyof Viewport) =>
    Math.min(
      Math.max(value ?? DEFAULT_VIEWPORT[key], MIN_VIEWPORT[key]),
      MAX_VIEWPORT[key],
    );
  return {
    width: clamp(input?.width, 'width'),
    height: clamp(input?.height, 'height'),
  };
}

export const test_interactive: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};
