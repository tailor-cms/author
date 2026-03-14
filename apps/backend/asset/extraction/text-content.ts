/**
 * Text content extraction for the asset indexing pipeline.
 *
 * When a link asset is indexed into the vector store, we need its
 * page content as clean text. This module extracts that content
 * using a two-tier strategy:
 *
 * 1. Jina Reader API (r.jina.ai) - free service that returns clean
 *    markdown. Handles JS-rendered SPAs, paywalls, and complex
 *    layouts better than raw HTML parsing. Higher timeout (15s)
 *    because Jina renders pages server-side.
 *
 * 2. html-to-text fallback - direct HTML fetch + conversion.
 *    Strips navigation, footer, sidebar, scripts, and styles to
 *    extract only the main content. Used when Jina is unavailable.
 *
 * Output is capped at 50k chars - large enough for meaningful
 * vector store embeddings, small enough to avoid token limits.
 */
import axios from 'axios';
import { htmlToText } from 'html-to-text';

import { createLogger } from '#logger';
import { discovery as config } from '#config';

const logger = createLogger('asset:content-extraction');

const { apiUrl: JINA_URL, timeout: JINA_TIMEOUT } = config.jina;

const FALLBACK_TIMEOUT = 5000;
const MAX_LENGTH = 50000;

// Elements stripped during HTML → text conversion (non-content noise)
const SKIP_SELECTORS = [
  'nav', 'footer', 'header', 'aside', 'script', 'style', 'img',
];

/**
 * Extracts clean text content from a URL.
 * Tries Jina Reader first, falls back to direct HTML parsing.
 */
export async function fetchUrlText(url: string): Promise<string> {
  try {
    return await fetchViaJina(url);
  } catch (err) {
    logger.warn(
      err,
      `Jina Reader failed for ${url}, falling back to direct fetch`,
    );
    return fetchViaHtmlToText(url);
  }
}

/** Fetches clean markdown via Jina Reader API. */
async function fetchViaJina(url: string): Promise<string> {
  const { data } = await axios.get(`${JINA_URL}/${url}`, {
    timeout: JINA_TIMEOUT,
    headers: { 'Accept': 'text/markdown', 'X-No-Cache': 'true' },
    responseType: 'text',
  });
  return String(data).slice(0, MAX_LENGTH);
}

/** Fetches HTML directly and converts to plain text. */
async function fetchViaHtmlToText(url: string): Promise<string> {
  const { data: html } = await axios.get(url, {
    timeout: FALLBACK_TIMEOUT,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TailorCMS/1.0)',
    },
    maxRedirects: 5,
    responseType: 'text',
  });
  const text = htmlToText(html, {
    selectors: [
      ...SKIP_SELECTORS.map((s) => (
        { selector: s, format: 'skip' }
      )),
      { selector: 'a', options: { ignoreHref: true } },
    ],
    wordwrap: false,
  });
  return text.replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_LENGTH);
}
