<template>
  <VAlert class="px-3 py-2 mb-3" type="warning" variant="tonal">
    <VAlertTitle class="text-title-medium font-weight-semibold">
      Copy the webhook URL now!
    </VAlertTitle>
    <p class="text-body-medium">
      It contains a secret token and won't be shown again.
    </p>
  </VAlert>
  <VSheet
    class="d-flex align-center ga-2 px-4 py-3 mb-2"
    color="surface-sunken"
    rounded="lg"
  >
    <code class="webhook-url flex-grow-1 text-body-small">{{ webhookUrl }}</code>
    <VBtn
      v-tooltip:top="isCopied ? 'Copied' : 'Copy webhook URL'"
      :color="isCopied ? 'success' : undefined"
      :icon="isCopied ? 'mdi-check' : 'mdi-content-copy'"
      aria-label="Copy webhook URL"
      density="comfortable"
      size="small"
      variant="text"
      @click="copyUrl"
    />
  </VSheet>
  <p class="text-body-medium text-medium-emphasis mb-2">
    To start posting, open a thread, choose <strong>Subscribe</strong> and
    select <strong>{{ integration.name }}</strong>.
  </p>
</template>

<script lang="ts" setup>
import type { Integration } from './useIntegrations';
import { refAutoReset } from '@vueuse/core';

const COPIED_DURATION = 2000;

const props = defineProps<{
  integration: Integration;
  webhookUrl: string;
}>();

const copy = useCopyToClipboard();
const isCopied = refAutoReset(false, COPIED_DURATION);

const copyUrl = async () => {
  isCopied.value = await copy(props.webhookUrl, 'webhook URL');
};
</script>

<style lang="scss" scoped>
.webhook-url {
  overflow-wrap: anywhere;
  line-height: 1.4;
}
</style>
