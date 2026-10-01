// One shared headless browser for running AI-written pages, opened on
// first use. Every run gets a fresh, isolated context.
import {
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  chromium,
} from 'playwright-core';
import { ai as aiConfig, isProduction } from '#config';
import { createAiLogger } from '../logger.ts';

const logger = createAiLogger('sandbox.browser');

// Software WebGL, so canvas / 3D content renders on GPU-less servers.
const LAUNCH_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

// Close an idle local browser to give its memory back.
const IDLE_CLOSE_MS = 5 * 60 * 1000;

// A remote browser is billed while connected, so it is let go at once.
const isRemote = !!aiConfig.browser.wsEndpoint;

export class BrowserUnavailableError extends Error {}

class BrowserPool {
  private browser: Promise<Browser> | null = null;
  private active = 0;
  private readonly waiting: (() => void)[] = [];
  private idleTimer: NodeJS.Timeout | null = null;

  /**
   * Run `fn` with a fresh browser context; the context is closed afterwards
   * whatever happens. Waits for a free slot when `maxPages` are busy.
   */
  async withContext<T>(
    opts: BrowserContextOptions,
    fn: (context: BrowserContext) => Promise<T>,
  ): Promise<T> {
    await this.acquire();
    let context: BrowserContext | undefined;
    try {
      const browser = await this.getBrowser();
      // Service workers are already off: the page runs under a CSP
      // sandbox (see network.ts).
      context = await browser.newContext({ ...opts, acceptDownloads: false });
      return await fn(context);
    } finally {
      await context?.close().catch(() => {});
      this.release();
    }
  }

  async close(): Promise<void> {
    const pending = this.browser;
    this.browser = null;
    if (!pending) return;
    const browser = await pending.catch(() => null);
    await browser?.close().catch(() => {});
  }

  private getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    this.browser = openBrowser()
      .then((browser) => {
        browser.on('disconnected', () => {
          this.browser = null;
        });
        return browser;
      })
      .catch((err) => {
        this.browser = null;
        logger.error({ err }, 'browser unavailable');
        throw new BrowserUnavailableError(err.message);
      });
    return this.browser;
  }

  private async acquire(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (this.active < aiConfig.browser.maxPages) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  // Hands the slot straight to the next waiter, if any.
  private release(): void {
    const next = this.waiting.shift();
    if (next) return next();
    this.active--;
    if (this.active) return;
    if (isRemote) return void this.close();
    this.idleTimer = setTimeout(() => void this.close(), IDLE_CLOSE_MS);
    this.idleTimer.unref();
  }
}

/**
 * Production only connects to a remote browser: a local one would run
 * generated code next to the app's secrets (see README).
 */
async function openBrowser(): Promise<Browser> {
  const { wsEndpoint, protocol } = aiConfig.browser;
  if (!wsEndpoint && isProduction) {
    throw new Error('no remote browser configured (AI_BROWSER_WS_ENDPOINT)');
  }
  if (!wsEndpoint) return chromium.launch({ args: LAUNCH_ARGS });
  logger.debug({ protocol }, 'connecting to remote browser');
  return protocol === 'cdp'
    ? chromium.connectOverCDP(wsEndpoint)
    : chromium.connect(wsEndpoint);
}

export const browserPool = new BrowserPool();
