import type { Check } from './types.ts';

import { ai, auth, consumer, mail } from '#config';

// Configuration-only reporters for optional external integrations. We do
// NOT make live network calls here: We report whether each integration is
// wired up. The descriptive `output` (model id, SMTP host, webhook URL)
// is only ever shown to authenticated admins; it is stripped from the
// public report.
function configured(
  name: string,
  isConfigured: boolean,
  detail: string,
): Check {
  return {
    name,
    componentType: 'component',
    critical: false,
    readiness: false,
    run: async () => ({
      status: 'pass',
      output: isConfigured ? detail : 'not configured',
    }),
  };
}

export default [
  configured('openai', ai.isEnabled, `model: ${ai.modelId}`),
  configured('mail', Boolean(mail.host), `host: ${mail.host}`),
  configured('oidc', auth.oidc.enabled, `issuer: ${auth.oidc.issuer}`),
  configured(
    'consumer-webhook',
    Boolean(consumer.publishWebhookUrl),
    `publish: ${consumer.publishWebhookUrl}`,
  ),
];
