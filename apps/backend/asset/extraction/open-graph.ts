/**
 * Open Graph metadata extraction for link assets.
 *
 * When a user adds a URL as a link asset, this module collects the
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

import { assertPublicUrl } from '../utils/url-guard.ts';
import { createLogger } from '#logger';
import { detectLinkName } from '@tailor-cms/common/asset';
import { discovery as config } from '#config';

const logger = createLogger('asset:og');

export interface OpenGraphData {
  title: string;
  description: string;
  thumbnail: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  favicon: string;
  domain: string;
  siteName: string;
  // Open Graph type (og:type) e.g. "website", "article", "video.movie"
  ogType: string;
  // Attribution
  author: string;
  tags: string[];
  license: string;
}

// Collects structured metadata from a URL, falling back across
// OG → Twitter Card → Dublin Core → domain name.
export async function fetchOpenGraph(url: string): Promise<OpenGraphData> {
  const domain = new URL(url).hostname;
  const name = detectLinkName(url);
  try {
    await assertPublicUrl(url);
    const { result } = await ogs({ url, timeout: config.ogs.timeout });
    return {
      title:
        name || result.ogTitle || result.twitterTitle || result.dcTitle || '',
      description:
        result.ogDescription ||
        result.twitterDescription ||
        result.dcDescription ||
        '',
      thumbnail:
        result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
      thumbnailWidth:
        Number(
          result.ogImage?.[0]?.width || result.twitterImage?.[0]?.width || 0,
        ) || 0,
      thumbnailHeight:
        Number(
          result.ogImage?.[0]?.height || result.twitterImage?.[0]?.height || 0,
        ) || 0,
      favicon: result.favicon ? resolveUrl(result.favicon, url) : '',
      domain,
      siteName: result.ogSiteName || '',
      ogType: result.ogType || '',
      author:
        result.author ||
        result.articleAuthor ||
        result.ogArticleAuthor ||
        result.twitterCreator ||
        result.dcCreator ||
        '',
      tags: parseTags(result),
      license: result.dcRights || '',
    };
  } catch (err) {
    logger.warn({ err, url }, 'OG collection failed, using defaults');
    return {
      title: name,
      description: '',
      thumbnail: '',
      thumbnailWidth: 0,
      thumbnailHeight: 0,
      favicon: '',
      domain,
      siteName: '',
      ogType: '',
      author: '',
      tags: [],
      license: '',
    };
  }
}

// Collects tags from article, video, and Dublin Core metadata.
// Sources: article:tag, og:article:tag, og:video:tag, dc:subject.
// dc:subject is often comma-separated ("AI, ML, NLP"); others are
// single values per meta element (ogs only captures the last one).
function parseTags(result: any): string[] {
  const raw = [
    result.articleTag,
    result.ogArticleTag,
    result.ogVideoTag,
    result.dcSubject,
  ]
    .filter(Boolean)
    .join(',');
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean),
    ),
  ];
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
