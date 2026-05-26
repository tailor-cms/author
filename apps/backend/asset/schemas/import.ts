// Wire shape for importing an asset from a URL.
// Collects Open Graph metadata, optionally downloads the linked file
// for IMAGE / PDF content types, and merges any caller-supplied attribution
// into the resulting record.
import {
  CONTENT_TYPES,
  ContentType,
} from '@tailor-cms/interfaces/discovery.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { isPublicUrl } from '../utils/url-guard.ts';

// SSRF guard adapter: `isPublicUrl` throws on private/localhost URLs;
const publicUrlRefine = (value: string) => {
  try {
    isPublicUrl(value);
    return true;
  } catch {
    return false;
  }
};

const safeUrl = () =>
  z.url().refine(publicUrlRefine, 'URL must be a public https URL.');

// Caller-supplied attribution; merged with OG-collected values by the
// service (caller wins on collisions).
const ImportMeta = z
  .object({
    contentType: z.enum(ContentType).optional().describe(oneLine`
      Discovery content type (one of ${CONTENT_TYPES.join(', ')});
      drives whether the import downloads the file or stores as a link.`),
    title: z.string().trim().optional().describe('Override resolved title.'),
    description: z
      .string()
      .trim()
      .optional()
      .describe('Override resolved description.'),
    downloadUrl: safeUrl().optional().describe(oneLine`
      Explicit binary URL when different from the page URL
      (e.g. CDN URL).`),
    altText: z
      .string()
      .trim()
      .optional()
      .describe('Alt text for image-like content.'),
    author: z
      .string()
      .trim()
      .optional()
      .describe('Override resolved author attribution.'),
    license: z.string().trim().optional().describe('License identifier.'),
    tags: z
      .array(z.string().trim())
      .optional()
      .describe('Asset tags.'),
  })
  .describe('Optional metadata; merged with Open Graph metadata.');

export const ImportFromLinkInput = z.object({
  url: safeUrl().describe('Public https URL to import.'),
  meta: ImportMeta.optional(),
}).describe('Create an asset from a URL.');

export type ImportFromLinkInput = z.infer<typeof ImportFromLinkInput>;
