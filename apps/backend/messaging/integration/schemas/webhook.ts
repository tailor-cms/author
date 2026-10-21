// Wire shapes for the public inbound webhook.
//
// The payload is Slack-compatible: the legacy attachment format that CI
// systems, alerting tools and dashboards already emit, so a producer
// needs no Tailor-specific code path.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { ShortText } from '#shared/request/schemas.ts';

// Deliberately a permissive subset: unknown fields are dropped rather
// than rejected, so a Slack-compatible producer needs no Tailor-specific
// code path and only the fields below reach the message row.
export const SlackAttachment = z
  .object({
    fallback: z.string().optional().describe('Plain-text summary.'),
    color: z.string().optional(),
    pretext: z.string().optional(),
    author_name: z.string().optional(),
    title: z.string().optional(),
    title_link: z.url().optional(),
    text: z.string().optional(),
    fields: z
      .array(
        z.object({
          title: z.string().optional(),
          value: z.string().optional(),
          short: z.boolean().optional(),
        }),
      )
      .optional(),
    footer: z.string().optional(),
    ts: z.union([z.number(), z.string()]).optional(),
  })
  .meta({ id: 'SlackAttachment' });

export type SlackAttachment = z.infer<typeof SlackAttachment>;

export const InboundWebhookInput = z
  .object({
    text: z.string().optional().describe('Message body (markdown-ish).'),
    // Slack's per-post sender overrides.
    username: z.string().optional().describe(oneLine`
      Name this post shows instead of the integration's own, so one
      credential can speak as "Deploy" and as "Tests". The BOT marker
      stays either way.
    `),
    icon_emoji: z.string().optional().describe(oneLine`
      Emoji shortcode (\`:rocket:\`) to show instead of the
      integration's icon. Resolved against the workspace's emoji; an
      unknown name falls back to the icon.
    `),
    icon_url: z.string().optional().describe(oneLine`
      Not applied. An icon is either the integration's own or one of the
      workspace's emoji, so a post never hotlinks a remote image.
    `),
    attachments: z.array(SlackAttachment).optional(),
  })
  .refine((it) => !!it.text?.trim() || !!it.attachments?.length, {
    message: 'Either `text` or `attachments` is required',
    path: ['text'],
  })
  .describe(oneLine`
    Slack-compatible incoming webhook payload. Unknown fields are
    dropped. Either \`text\` or at least one attachment is required.
  `);

export type InboundWebhookInput = z.infer<typeof InboundWebhookInput>;

export const WebhookParams = z.object({
  token: ShortText(8, 128).describe('Inbound webhook token.'),
});

export type WebhookParams = z.infer<typeof WebhookParams>;
