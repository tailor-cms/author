<template>
  <VListItem
    :title="integration.name"
    class="integration-row bg-surface-overlay py-2 px-3"
    density="compact"
    rounded="lg"
    elevation="1"
  >
    <template #prepend>
      <IntegrationAvatar :integration="integration" :size="32" />
    </template>
    <template v-if="isExternal" #subtitle>
      <code>integration:{{ integration.key }}</code>
    </template>
    <template v-if="isExternal" #append>
      <VBtn
        v-tooltip:left="'Revoke'"
        :aria-label="`Revoke ${integration.name}`"
        color="error"
        class="revoke-btn text-medium-emphasis"
        density="comfortable"
        icon="mdi-trash-can-outline"
        size="small"
        variant="plain"
        rounded="lg"
        @click="emit('revoke:integration', integration)"
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import type { Integration } from './useIntegrations';
import { IntegrationType } from '@tailor-cms/interfaces/comment';
import IntegrationAvatar from '../IntegrationAvatar.vue';

const props = defineProps<{ integration: Integration }>();

const emit = defineEmits<{
  'revoke:integration': [integration: Integration];
}>();

const isExternal = computed(
  () => props.integration.type === IntegrationType.External,
);
</script>

<style lang="scss" scoped>
.revoke-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.integration-row:hover .revoke-btn,
.integration-row:focus-within .revoke-btn {
  opacity: 1;
}

:deep(.v-list-item-title) {
  line-height: 1.1;
  font-size: 0.875rem;
}

:deep(.v-list-item-subtitle) {
  line-height: 1.1;
  font-size: 0.75rem;
}
</style>
