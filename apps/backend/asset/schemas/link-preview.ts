import { LinkContentType } from '@tailor-cms/interfaces/asset';
import { oneLine } from 'common-tags';
import { safeUrl } from './import.ts';
import { z } from 'zod';

export const LinkPreviewFilter = z.object({
  url: safeUrl().describe('Public https URL to describe.'),
});

export const LinkPreview = z
  .object({
    url: z.string(),
    title: z.string().describe('Page title, or empty behind a sign-in.'),
    description: z.string(),
    siteName: z.string(),
    domain: z.string(),
    favicon: z.string(),
    thumbnail: z.string(),
    thumbnailWidth: z
      .number()
      .describe('Advertised width; 0 when the page did not say.'),
    thumbnailHeight: z.number(),
    provider: z.string().describe(oneLine`
      Recognised service, e.g. google-docs, sharepoint. Empty unless the
      URL names one; the client turns it into an icon, a colour and a
      label.
    `),
    contentType: z
      .enum(LinkContentType)
      .nullable()
      .describe('What the link points at; null when the URL does not say.'),
  })
  .meta({ id: 'LinkPreview' })
  .describe('What is on the other end of a link.');

export type LinkPreview = z.infer<typeof LinkPreview>;
export type LinkPreviewFilter = z.infer<typeof LinkPreviewFilter>;
