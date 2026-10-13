// Network policy for pages under test.
// The only real traffic allowed is to public CDNs
// that host versioned libraries. Everything else is blocked and reported,
// since a single-file page can't rely on it once published.
import type { BrowserContext, Route } from 'playwright-core';

export const SANDBOX_ORIGIN = 'https://sandbox.tailor.invalid';

// CSP sandbox applied to the iframe hosting the page under test.
const FRAME_SANDBOX_CSP = 'sandbox allow-scripts allow-popups allow-pointer-lock';

export const SANDBOX_URL = `${SANDBOX_ORIGIN}/index.html`;

// CDNs generated pages may load libraries from, at pinned versions.
// esm.sh serves ES modules.
export const LIBRARY_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'esm.sh',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const CDN_HOSTS = [...LIBRARY_HOSTS, ...FONT_HOSTS];

// Browsers ask for it on their own; not the page's fault.
const FAVICON_URL = `${SANDBOX_ORIGIN}/favicon.ico`;

export function isCdnUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && CDN_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

/**
 * A request to the page's own origin, e.g. a relative path like
 * `./data.json`. A stored interactive page has no files next to it,
 * so these fail for readers.
 */
export function isSameOriginUrl(url: string): boolean {
  return url.startsWith(`${SANDBOX_ORIGIN}/`) && url !== FAVICON_URL;
}

export interface NetworkPolicyOptions {
  html: string;
  // Block CDNs too; used to prove a bundled page is self-contained.
  isOffline?: boolean;
  // Collects every URL the policy refused.
  blocked: string[];
}

/**
 * Serve the page and gate every other request of the context. The page is
 * served with the same CSP sandbox it gets in production, so an opaque
 * origin (no storage, no cookies) is part of the test too.
 */
export async function applyNetworkPolicy(
  context: BrowserContext,
  opts: NetworkPolicyOptions,
): Promise<void> {
  const { html, isOffline, blocked } = opts;
  await context.route('**/*', (route: Route) => {
    const url = route.request().url();
    if (url === SANDBOX_URL) {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        headers: { 'Content-Security-Policy': FRAME_SANDBOX_CSP },
        body: html,
      });
    }
    if (url === FAVICON_URL) return route.fulfill({ status: 204 });
    if (!isOffline && isCdnUrl(url)) return route.continue();
    blocked.push(url);
    return route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (ws) => {
    blocked.push(ws.url());
    return ws.close();
  });
}
