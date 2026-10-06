// Makes a page self-contained before it is stored: CDN scripts and
// stylesheets are downloaded and inlined.
// Fonts and images a stylesheet points to stay on the CDN; without them
// the page still works, with fallback fonts.
import type { Cheerio, CheerioAPI } from 'cheerio';

import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';
import { isCdnUrl } from './network.ts';

export interface BundleResult {
  html: string;
  inlined: string[];
  failed: { url: string; reason: string }[];
}

type Kind = 'script' | 'stylesheet';

type Download =
  | { ok: true; body: Buffer; contentType: string }
  | { ok: false; error: string };

// A node of the parsed page.
type Node = Parameters<CheerioAPI['contains']>[0];

interface Target {
  $el: Cheerio<Node>;
  kind: Kind;
  url: string;
}

interface BundleContext {
  $: CheerioAPI;
  // One download per URL
  downloads: Map<string, Promise<Download>>;
  result: BundleResult;
  remainingBytes: number;
}

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

const SOURCE_ATTR = 'data-inlined-from';

// "alternate stylesheet" is an optional theme the page doesn't use by
// default; copied into the page it would always apply, so we skip it.
const TARGETS = [
  'script[src]',
  'link[rel~="stylesheet"][href]:not([rel~="alternate"])',
].join(', ');

const EXPECTED_TYPE: Record<Kind, RegExp> = {
  script: /javascript|ecmascript/i,
  stylesheet: /^text\/css/i,
};
const SRI_HASH = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})/;
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

const CSS_RELATIVE_URL =
  /url\(\s*(['"]?)(?!data:|https?:|#|\/\/)([^'")]+)\1\s*\)/gi;
const CSS_RELATIVE_IMPORT = /@import\s+(['"])(?!https?:|\/\/)([^'"]+)\1/gi;

export async function bundlePage(html: string): Promise<BundleResult> {
  const $ = cheerio.load(html);
  const targets = $(TARGETS)
    .toArray()
    .map((el) => $(el) as Cheerio<Node>)
    .map(($el) => ({ $el, kind: kindOf($el), url: sourceOf($el) }))
    .filter((it): it is Target => it.url !== null);
  const ctx: BundleContext = {
    $,
    downloads: new Map(),
    result: { html, inlined: [], failed: [] },
    remainingBytes: MAX_TOTAL_BYTES,
  };
  for (const { url } of targets) {
    if (!ctx.downloads.has(url)) ctx.downloads.set(url, download(url));
  }
  // Applied in page order, so the size budget goes to the first ones.
  for (const target of targets) await inline(target, ctx);
  // Nothing inlined: keep the page exactly as written.
  if (ctx.result.inlined.length) ctx.result.html = $.html();
  return ctx.result;
}

// Reverse of bundlePage: inlined libraries become CDN references again.
export function unbundlePage(html: string): string {
  const $ = cheerio.load(html);
  const blocks = $(`script[${SOURCE_ATTR}], style[${SOURCE_ATTR}]`);
  if (!blocks.length) return html;
  blocks.each((_, el) => {
    const $el = $(el);
    const { [SOURCE_ATTR]: url, ...attrs } = $el.attr() ?? {};
    if (el.tagName === 'script') {
      $el.removeAttr(SOURCE_ATTR).attr('src', url!).text('');
      return;
    }
    $el.replaceWith(
      $('<link rel="stylesheet">').attr('href', url!).attr(attrs),
    );
  });
  return $.html();
}

const kindOf = ($el: Cheerio<Node>): Kind =>
  $el.is('script') ? 'script' : 'stylesheet';

// The CDN file a tag loads, if it is one we inline.
function sourceOf($el: Cheerio<Node>): string | null {
  const isScript = $el.is('script');
  // A script with a body of its own isn't a plain library include.
  if (isScript && $el.text().trim()) return null;
  // An ES module can load additional files
  if (isScript && $el.attr('type')?.trim().toLowerCase() === 'module') {
    return null;
  }
  const value = $el.attr(isScript ? 'src' : 'href')?.trim();
  if (!value) return null;
  const url = value.startsWith('//') ? `https:${value}` : value;
  return isCdnUrl(url) ? url : null;
}

async function inline({ $el, kind, url }: Target, ctx: BundleContext) {
  const content = await accept(url, kind, $el.attr('integrity'), ctx);
  if (content === null) return;
  if (kind === 'script') return inlineScript($el, url, content);
  inlineStylesheet(ctx.$, $el, url, content);
}

function inlineScript($el: Cheerio<Node>, url: string, code: string) {
  $el.attr(SOURCE_ATTR, url);
  // Browsers ignore `defer` / `async` unless the script has a src, so the
  // library would run too early. Instead, its code goes into the src.
  if ($el.is('[defer], [async]')) {
    const base64 = Buffer.from(code, 'utf8').toString('base64');
    $el.attr('src', `data:text/javascript;base64,${base64}`);
    return;
  }
  $el.removeAttr('src');
  // A literal "</script" inside the code would end the tag early.
  $el.text(code.replace(/<\/script/gi, '<\\/script'));
}

function inlineStylesheet(
  $: CheerioAPI,
  $el: Cheerio<Node>,
  url: string,
  css: string,
) {
  const safeCss = rebaseCss(css, url).replace(/<\/style/gi, '<\\/style');
  // Same for the link's attributes (`media` keeps applying as before).
  const { rel: _rel, href: _href, ...attrs } = $el.attr() ?? {};
  const $style = $('<style></style>').attr(attrs).attr(SOURCE_ATTR, url);
  $el.replaceWith($style.text(safeCss));
}

// Keeps fonts, images and imports loading from where the stylesheet lives.
function rebaseCss(css: string, base: string): string {
  const absolute = (path: string) => new URL(path, base).href;
  return css
    .replace(
      CSS_RELATIVE_URL,
      (_, quote, path) => `url(${quote}${absolute(path)}${quote})`,
    )
    .replace(
      CSS_RELATIVE_IMPORT,
      (_, quote, path) => `@import ${quote}${absolute(path)}${quote}`,
    );
}

/**
 * Checks a downloaded file before it goes into the page and charges it to
 * the size budget. A rejected file is reported and its tag keeps loading
 * from the CDN.
 */
async function accept(
  url: string,
  kind: Kind,
  integrity: string | undefined,
  ctx: BundleContext,
): Promise<string | null> {
  const reject = (reason: string) => {
    ctx.result.failed.push({ url, reason });
    return null;
  };
  const file = await ctx.downloads.get(url);
  if (!file) return reject('not downloaded');
  if (!file.ok) return reject(file.error);
  if (!EXPECTED_TYPE[kind].test(file.contentType)) {
    return reject(`not a ${kind} (${file.contentType || 'no content type'})`);
  }
  if (integrity && !matchesIntegrity(file.body, integrity)) {
    return reject('does not match its integrity hash');
  }
  if (file.body.byteLength > ctx.remainingBytes) {
    return reject('bundle size limit reached');
  }
  ctx.remainingBytes -= file.body.byteLength;
  ctx.result.inlined.push(url);
  return file.body.toString('utf8');
}

/**
 * Checks the file against the tag's `integrity` attribute, the hash the
 * author pinned so a changed CDN file is refused (e.g.
 * `integrity="sha384-oqVu..."`). The attribute may list several hashes;
 * matching any one is enough.
 */
function matchesIntegrity(body: Buffer, integrity: string): boolean {
  const hashes = integrity
    .trim()
    .split(/\s+/)
    .map((token) => token.match(SRI_HASH))
    .filter((match): match is RegExpMatchArray => match !== null);
  if (!hashes.length) return true;
  return hashes.some(
    ([, algorithm, expected]) =>
      createHash(algorithm!).update(body).digest('base64') === expected,
  );
}

async function download(url: string): Promise<Download> {
  try {
    const res = await fetchFromCdn(url);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const body = await readBody(res, MAX_FILE_BYTES);
    const contentType = res.headers.get('content-type') ?? '';
    return { ok: true, body, contentType };
  } catch (err) {
    return { ok: false, error: describeError(err) };
  }
}

// Follows redirects only while they stay on an allowed CDN
async function fetchFromCdn(url: string, redirects = 0): Promise<Response> {
  // Google Fonts tailors its CSS to the browser; a current one gets woff2 (for smaller file size)
  const USER_AGENT = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  ].join(' ');
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const location = res.headers.get('location');
  if (!REDIRECT_STATUSES.includes(res.status) || !location) return res;
  await res.body?.cancel();
  const next = new URL(location, url).href;
  if (!isCdnUrl(next)) throw new Error(`redirected off the CDN (${next})`);
  if (redirects >= MAX_REDIRECTS) throw new Error('too many redirects');
  return fetchFromCdn(next, redirects + 1);
}

// Reads the body, giving up as soon as it outgrows the limit, so an
// oversized file never sits in memory whole.
async function readBody(res: Response, limit: number): Promise<Buffer> {
  const tooLarge = () => new Error('file too large to inline');
  if (Number(res.headers.get('content-length')) > limit) throw tooLarge();
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return Buffer.concat(chunks);
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }
}

function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  return err.name === 'TimeoutError' ? 'timed out' : err.message;
}
