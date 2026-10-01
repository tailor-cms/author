// Interactions the assistant performs on a page it wrote, the way a
// end-user would, to check that it behaves: click a control, drag a handle,
// move a slider, read the resulting state back.
import type { Page } from 'playwright-core';
import { describeInteractionResult, withTimeout } from './util.ts';

export const INTERACTION_ACTIONS = [
  'click', 'hover', 'fill', 'press', 'drag', 'wait', 'evaluate', 'screenshot',
] as const;

export type InteractionAction = (typeof INTERACTION_ACTIONS)[number];

export interface Interaction {
  action: InteractionAction;
  // CSS selector of the element to interact with.
  selector?: string | null;
  // Drag target selector.
  target?: string | null;
  // Coordinates (CSS px from the viewport's top-left) when not using
  // a selector; `toX`/`toY` end a drag.
  x?: number | null;
  y?: number | null;
  toX?: number | null;
  toY?: number | null;
  // Text for `fill`, key for `press` (e.g. "ArrowRight", "Enter").
  value?: string | null;
  // Pause for `wait` without a selector.
  ms?: number | null;
  // JS expression for `evaluate`; its (JSON-serializable) value is returned.
  expression?: string | null;
  // Name for a `screenshot`.
  label?: string | null;
}

export interface InteractionResult {
  index: number;
  action: InteractionAction;
  ok: boolean;
  result?: string;
  error?: string;
  // Page errors raised by this interaction.
  newErrors?: number;
}

export interface InteractionHooks {
  captureScreenshot: (label: string) => Promise<void>;
  errorCount: () => number;
}

export const MAX_INTERACTIONS = 25;
export const MAX_WAIT_MS = 5_000;

// Lets the page react (re-render, start a transition) before the next one.
const AFTER_ACTION_MS = 150;
const ACTION_TIMEOUT_MS = 5_000;
const MAX_RESULT_CHARS = 1_500;

/**
 * Performs the interactions in order and stops at the first one that
 * fails, since the following ones usually build on it.
 */
export async function runInteractions(
  page: Page,
  interactions: Interaction[],
  hooks: InteractionHooks,
): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  const queue = interactions.slice(0, MAX_INTERACTIONS);
  for (const [index, interaction] of queue.entries()) {
    const errorsBefore = hooks.errorCount();
    const result = await runInteraction(page, interaction, index, hooks);
    const newErrors = hooks.errorCount() - errorsBefore;
    results.push(newErrors ? { ...result, newErrors } : result);
    if (!result.ok) break;
  }
  return results;
}

async function runInteraction(
  page: Page,
  interaction: Interaction,
  index: number,
  hooks: InteractionHooks,
): Promise<InteractionResult> {
  const base = { index, action: interaction.action };
  try {
    const value = await withTimeout(
      performAction(page, interaction, hooks),
      ACTION_TIMEOUT_MS + 1_000,
      'Timed out - the page may be unresponsive.',
    );
    await page.waitForTimeout(AFTER_ACTION_MS);
    if (value === undefined) return { ...base, ok: true };
    const result = describeInteractionResult(value, MAX_RESULT_CHARS);
    return { ...base, ok: true, result };
  } catch (err: any) {
    return { ...base, ok: false, error: firstLine(err.message) };
  }
}

async function performAction(
  page: Page,
  interaction: Interaction,
  hooks: InteractionHooks,
): Promise<unknown> {
  const { action, selector, value } = interaction;
  const opts = { timeout: ACTION_TIMEOUT_MS };
  switch (action) {
    case 'click':
      if (selector) return page.click(selector, opts);
      return page.mouse.click(...point(interaction));
    case 'hover':
      if (selector) return page.hover(selector, opts);
      return page.mouse.move(...point(interaction));
    case 'fill':
      return fill(page, required(selector, 'selector'), value ?? '');
    case 'press':
      if (selector) {
        return page.press(selector, required(value, 'value'), opts);
      }
      return page.keyboard.press(required(value, 'value'));
    case 'drag':
      return drag(page, interaction);
    case 'wait':
      if (selector) {
        return page.waitForSelector(selector, { ...opts, state: 'visible' })
          .then(() => undefined);
      }
      return page.waitForTimeout(Math.min(interaction.ms ?? 500, MAX_WAIT_MS));
    case 'evaluate':
      return page.evaluate(required(interaction.expression, 'expression'));
    case 'screenshot':
      return hooks.captureScreenshot(interaction.label || `after ${action}`);
    default:
      throw new Error(`Unknown action "${action}".`);
  }
}

async function fill(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  try {
    await locator.fill(value, { timeout: ACTION_TIMEOUT_MS });
  } catch (err: any) {
    if (!/cannot be filled|not an <input>/i.test(err.message)) throw err;
    await locator.evaluate((el: any, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }
}

async function drag(page: Page, interaction: Interaction) {
  const { selector, target } = interaction;
  if (selector && target) {
    return page.dragAndDrop(selector, target, { timeout: ACTION_TIMEOUT_MS });
  }
  const [x, y] = point(interaction);
  const toX = required(interaction.toX, 'toX');
  const toY = required(interaction.toY, 'toY');
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Glide in small moves like a real hand; a single jump would skip the
  // pointer events
  await page.mouse.move(toX, toY, { steps: 12 });
  await page.mouse.up();
}

function point({ x, y }: Interaction): [number, number] {
  return [required(x, 'x or selector'), required(y, 'y')];
}

function required<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined || value === '') {
    throw new Error(`Missing "${name}".`);
  }
  return value;
}

// Playwright errors carry a long call log after the first line.
function firstLine(message = ''): string {
  return message.split('\n')[0] ?? message;
}
