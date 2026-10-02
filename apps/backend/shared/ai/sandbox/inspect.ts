// Load a single-file HTML page in the sandbox browser and report what
// happened: errors, console output, refused and failed requests, layout
// facts, results of interactions with the page, and screenshots.
import {
  type Interaction,
  type InteractionResult,
  runInteractions,
} from './interactions.ts';
import { clip, withTimeout } from './util.ts';
import type { BrowserContext, ConsoleMessage, Page } from 'playwright-core';
import { applyNetworkPolicy, SANDBOX_URL } from './network.ts';
import { browserPool } from './BrowserPool.ts';

export interface Viewport {
  width: number;
  height: number;
}

export interface PageIssue {
  message: string;
  // "line 42" inside the page, or the script URL it came from.
  location?: string;
  // The offending code, when known.
  code?: string;
}

export interface Screenshot {
  label: string;
  dataUrl: string;
}

export interface PageMetrics {
  title: string;
  domNodes: number;
  visibleElements: number;
  canvases: number;
  svgs: number;
  images: number;
  textChars: number;
  interactiveElements: number;
  contentSize: Viewport;
  hasHorizontalOverflow: boolean;
  hasVerticalOverflow: boolean;
  // Nothing visible to look at; usually a script that failed early.
  isLikelyBlank: boolean;
}

export interface InspectOptions {
  html: string;
  viewport?: Viewport;
  interactions?: Interaction[];
  isScreenshotEnabled?: boolean;
  // Block CDNs as well, to prove a bundled page is self-contained.
  isOffline?: boolean;
  // Time given to scripts and entry animations after load.
  settleMs?: number;
}

export interface InspectReport {
  isLoaded: boolean;
  loadMs: number;
  errors: PageIssue[];
  warnings: PageIssue[];
  logs: string[];
  blockedRequests: string[];
  failedRequests: { url: string; reason: string }[];
  metrics: PageMetrics | null;
  interactions: InteractionResult[];
  screenshots: Screenshot[];
}

type RawMetrics = Omit<
  PageMetrics,
  'hasHorizontalOverflow' | 'hasVerticalOverflow' | 'isLikelyBlank'
>;

export const DEFAULT_VIEWPORT: Viewport = { width: 960, height: 540 };
export const DEFAULT_SETTLE_MS = 800;
export const MAX_SETTLE_MS = 5_000;
export const MAX_SCREENSHOTS = 4;

const LOAD_TIMEOUT_MS = 15_000;
const EVALUATE_TIMEOUT_MS = 5_000;
const MAX_ISSUES = 20;
const MAX_LOGS = 30;
const MAX_MESSAGE_CHARS = 400;
const MAX_CODE_CHARS = 160;
const SCREENSHOT_QUALITY = 70;

// Console messages that aren't the page's fault, skipped so the model
// doesn't chase them.
// Chromium repeats every blocked or failed request as a console error;
// the request is already reported under blocked / failed requests.
const RESOURCE_ERROR = /^Failed to load resource/;

// WebGL pages warn about software rendering when we take a screenshot,
// since the server has no GPU. Not a problem in the page.
const GL_DRIVER_MESSAGE = /GL Driver Message/;

const INTERACTIVE_SELECTOR = [
  'button', 'a[href]', 'input', 'select', 'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const METRICS_SCRIPT = `(() => {
  const body = document.body;
  const all = Array.from(body ? body.querySelectorAll('*') : []);
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const root = document.documentElement;
  return {
    title: document.title,
    domNodes: all.length,
    visibleElements: all.filter(isVisible).length,
    canvases: document.querySelectorAll('canvas').length,
    svgs: document.querySelectorAll('svg').length,
    images: document.images.length,
    textChars: (body ? body.innerText : '').trim().length,
    interactiveElements: document
      .querySelectorAll('${INTERACTIVE_SELECTOR}').length,
    contentSize: { width: root.scrollWidth, height: root.scrollHeight },
  };
})()`;

export function inspectPage(opts: InspectOptions): Promise<InspectReport> {
  const viewport = opts.viewport ?? DEFAULT_VIEWPORT;
  return browserPool.withContext(
    { viewport, deviceScaleFactor: 1 },
    async (context) => {
      const report = createReport();
      await applyNetworkPolicy(context, {
        html: opts.html,
        isOffline: opts.isOffline,
        blocked: report.blockedRequests,
      });
      const page = await context.newPage();
      await trackErrors(context, page, opts.html, report);
      trackIssues(page, report);
      await load(page, report);
      await page.waitForTimeout(settleTime(opts.settleMs));
      report.metrics = await readMetrics(page, viewport, report);
      // An unresponsive page would only time out on every interaction.
      if (!report.metrics) return report;
      report.interactions = await runInteractions(
        page,
        opts.interactions ?? [],
        {
          captureScreenshot: (label) => capture(page, label, report),
          errorCount: () => report.errors.length,
        },
      );
      if (opts.isScreenshotEnabled) await captureFinal(page, report);
      return report;
    },
  );
}

function createReport(): InspectReport {
  return {
    isLoaded: false,
    loadMs: 0,
    errors: [],
    warnings: [],
    logs: [],
    blockedRequests: [],
    failedRequests: [],
    metrics: null,
    interactions: [],
    screenshots: [],
  };
}

async function load(page: Page, report: InspectReport): Promise<void> {
  const startedAt = Date.now();
  try {
    await page.goto(SANDBOX_URL, {
      waitUntil: 'load',
      timeout: LOAD_TIMEOUT_MS,
    });
    report.isLoaded = true;
  } catch (err: any) {
    const message = `Page did not finish loading: ${err.message}`;
    pushIssue(report.errors, { message });
  }
  report.loadMs = Date.now() - startedAt;
}

/**
 * Uncaught errors, read from Chromium directly: unlike Playwright's
 * `pageerror`, it gives the line of syntax errors too, so each error
 * points at the code to fix.
 */
async function trackErrors(
  context: BrowserContext,
  page: Page,
  html: string,
  report: InspectReport,
): Promise<void> {
  const lines = html.split('\n');
  const cdp = await context.newCDPSession(page);
  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails: details }) => {
    const { exception, text, url, lineNumber } = details;
    const message = exception?.description?.split('\n')[0] ?? text;
    const isPage = url === SANDBOX_URL;
    const code = isPage && lines[lineNumber]?.trim();
    pushIssue(report.errors, {
      message,
      location: isPage ? `line ${lineNumber + 1}` : url,
      ...(code && { code: clip(code, MAX_CODE_CHARS) }),
    });
  });
  await cdp.send('Runtime.enable');
}

function trackIssues(page: Page, report: InspectReport): void {
  page.on('console', (msg) => onConsole(msg, report));
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'failed';
    // Refused by the network policy; listed under blockedRequests.
    if (reason.includes('BLOCKED_BY_CLIENT')) return;
    report.failedRequests.push({ url: request.url(), reason });
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const reason = `HTTP ${response.status()}`;
    report.failedRequests.push({ url: response.url(), reason });
  });
}

function onConsole(msg: ConsoleMessage, report: InspectReport): void {
  const text = msg.text();
  const type = msg.type();
  if (type === 'error') {
    if (RESOURCE_ERROR.test(text)) return;
    return pushIssue(report.errors, { message: text, ...where(msg) });
  }
  if (type === 'warning') {
    if (GL_DRIVER_MESSAGE.test(text)) return;
    return pushIssue(report.warnings, { message: text, ...where(msg) });
  }
  if (report.logs.length >= MAX_LOGS) return;
  report.logs.push(clip(`[${type}] ${text}`, MAX_MESSAGE_CHARS));
}

function where(msg: ConsoleMessage): Pick<PageIssue, 'location'> {
  const { url, lineNumber } = msg.location();
  if (!url) return {};
  const location = url === SANDBOX_URL ? `line ${lineNumber + 1}` : url;
  return { location };
}

function pushIssue(list: PageIssue[], issue: PageIssue): void {
  if (list.length >= MAX_ISSUES) return;
  list.push({ ...issue, message: clip(issue.message, MAX_MESSAGE_CHARS) });
}

async function readMetrics(
  page: Page,
  viewport: Viewport,
  report: InspectReport,
): Promise<PageMetrics | null> {
  try {
    const raw: RawMetrics = await withTimeout(
      page.evaluate(METRICS_SCRIPT),
      EVALUATE_TIMEOUT_MS,
      'Page is unresponsive - its main thread stays busy (endless loop?).',
    );
    const hasGraphics = raw.canvases + raw.svgs + raw.images > 0;
    return {
      ...raw,
      hasHorizontalOverflow: raw.contentSize.width > viewport.width + 1,
      hasVerticalOverflow: raw.contentSize.height > viewport.height + 1,
      isLikelyBlank: !raw.visibleElements || (!raw.textChars && !hasGraphics),
    };
  } catch (err: any) {
    pushIssue(report.errors, { message: err.message });
    return null;
  }
}

async function capture(
  page: Page,
  label: string,
  report: InspectReport,
): Promise<void> {
  if (report.screenshots.length >= MAX_SCREENSHOTS) {
    throw new Error(`At most ${MAX_SCREENSHOTS} screenshots per test.`);
  }
  const buffer = await page.screenshot({
    type: 'jpeg',
    quality: SCREENSHOT_QUALITY,
    timeout: EVALUATE_TIMEOUT_MS,
  });
  const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  report.screenshots.push({ label, dataUrl });
}

// The final look matters most
async function captureFinal(page: Page, report: InspectReport) {
  if (report.screenshots.length >= MAX_SCREENSHOTS) return;
  await capture(page, 'final', report).catch((err) =>
    report.logs.push(clip(`[sandbox] screenshot failed: ${err.message}`, 200)),
  );
}

function settleTime(ms?: number | null): number {
  if (ms === null || ms === undefined) return DEFAULT_SETTLE_MS;
  return Math.min(Math.max(ms, 0), MAX_SETTLE_MS);
}
