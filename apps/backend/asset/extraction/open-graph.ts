/**
 * Open Graph metadata extraction for link assets.
 *
 * When a user adds a URL as a link asset, this module scrapes the
 * page's structured metadata to populate the asset card preview
 * (title, description, thumbnail, favicon, etc.).
 *
 * Websites embed metadata using several standards:
 * - Open Graph (og:*) - Facebook's protocol, most widely adopted.
 * - Twitter Cards (twitter:*) - X/Twitter's variant, still uses
 *   the `twitter:` prefix (not deprecated after the X rebrand).
 * - Dublin Core (dc:*) - academic / library standard, common on
 *   arxiv, government portals, and digital libraries.
 *
 * The `open-graph-scraper` library parses all three from a single
 * fetch. We apply a fallback chain (OG → Twitter → DC → default)
 * to maximize coverage at zero extra cost.
 */
import ogs from 'open-graph-scraper';

import { discovery as config } from '#config';

export interface OpenGraphData {
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  domain: string;
  siteName: string;
  // Open Graph type (og:type) e.g. "website", "article", "video.movie"
  ogType: string;
  // Attribution - extracted from OG/Twitter/DC but NOT spread into
  // Used to build `source` and `tags`.
  author: string;
  tags: string[];
  license: string;
}

/**
 * Scrapes structured metadata from a URL.
 * Falls back across OG → Twitter Card → Dublin Core → domain name.
 */
export async function fetchOpenGraph(
  url: string,
): Promise<OpenGraphData> {
  const { result } = await ogs({ url, timeout: config.ogs.timeout });
  const domain = new URL(url).hostname;
  return {
    title: result.ogTitle
      || result.twitterTitle || result.dcTitle || domain,
    description: result.ogDescription
      || result.twitterDescription || result.dcDescription || '',
    thumbnail: result.ogImage?.[0]?.url
      || result.twitterImage?.[0]?.url || '',
    favicon: result.favicon
      ? resolveUrl(result.favicon, url)
      : '',
    domain,
    siteName: result.ogSiteName || '',
    ogType: result.ogType || '',
    // Attribution: OG → Twitter → DC → HTML meta
    author: result.author || result.articleAuthor || result.ogArticleAuthor
      || result.twitterCreator || result.dcCreator || '',
    tags: parseTags(result),
    license: result.dcRights || '',
  };
}

// Collects tags from article:tag, og:article:tag, and dc:subject.
// dc:subject is often comma-separated ("AI, ML, NLP"); article:tag is
// a single value per meta element (ogs only captures the last one).
function parseTags(result: any): string[] {
  const raw = [result.articleTag, result.ogArticleTag, result.dcSubject]
    .filter(Boolean)
    .join(',');
  if (!raw) return [];
  return [...new Set(raw.split(',').map((t: string) => t.trim()).filter(Boolean))];
}

// Resolves potentially relative favicon hrefs against the page URL.
function resolveUrl(href: string, baseUrl: string): string {
  if (!href) return '';
  if (href.startsWith('http')) return href;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return '';
  }
}
