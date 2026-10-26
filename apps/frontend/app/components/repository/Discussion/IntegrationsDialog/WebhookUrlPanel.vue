<template>
  <div class="text-body-medium mb-3">
    Copy the webhook URL now. It contains a secret token and won't be shown
    again - if it's lost, register the integration again.
  </div>
  <VSheet
    class="d-flex align-center ga-2 px-4 py-3 mb-4"
    color="surface-sunken"
    rounded="lg"
  >
    <code class="webhook-url flex-grow-1 text-body-small">{{ webhookUrl }}</code>
    <VBtn
      v-tooltip:top="'Copy webhook URL'"
      aria-label="Copy webhook URL"
      density="comfortable"
      icon="mdi-content-copy"
      size="small"
      variant="text"
      @click="copy(webhookUrl, 'webhook URL')"
    />
  </VSheet>
  <VAlert
    type="info"
    icon="mdi-bell-outline"
    variant="tonal"
  >
    <VAlertTitle class="text-title-medium font-weight-semibold">
      Nothing is posted yet
    </VAlertTitle>
    <p class="text-body-medium">
      Open a thread, choose <strong>Subscribe</strong> and select
      <strong>{{ integration.name }}</strong>.
    </p>
  </VAlert>
</template>

<script lang="ts" setup>
import type { Integration } from './useIntegrations';

defineProps<{
  integration: Integration;
  webhookUrl: string;
}>();

const copy = useCopyToClipboard();
</script>

<style lang="scss" scoped>
.webhook-url {
  overflow-wrap: anywhere;
  line-height: 1.4;
}
</style>
