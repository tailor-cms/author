import { LinkContentType } from '@tailor-cms/interfaces/asset';
import { oneLine } from 'common-tags';
import { safeUrl } from './import.ts';
import { z } from 'zod';

export const UrlDescriptionFilter = z.object({
  url: safeUrl().describe('Public https URL to describe.'),
});

export const UrlDescription = z
  .object({
    url: z.string(),
    title: z.string().describe('Page title, or empty behind a sign-in.'),
    description: z.string(),
    siteName: z
      .string()
      .describe('Publisher name, where it differs from the domain.'),
    domain: z.string(),
    favicon: z.string(),
    thumbnail: z
      .string()
      .describe('Preview image URL; empty when there is none.'),
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
  .meta({ id: 'UrlDescription' })
  .describe('What is on the other end of a link.');

export type UrlDescription = z.infer<typeof UrlDescription>;
export type UrlDescriptionFilter = z.infer<typeof UrlDescriptionFilter>;
