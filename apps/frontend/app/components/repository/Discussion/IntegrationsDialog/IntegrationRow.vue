<template>
  <VListItem :title="integration.name" class="px-2" rounded="lg">
    <template #prepend>
      <IntegrationAvatar :integration="integration" :size="36" class="mr-3" />
    </template>
    <template #subtitle>
      <code v-if="isExternal">integration:{{ integration.key }}</code>
      <template v-else>Reports Tailor activity, by topic</template>
    </template>
    <template v-if="isExternal" #append>
      <VBtn
        v-tooltip:left="'Revoke'"
        :aria-label="`Revoke ${integration.name}`"
        color="error"
        density="comfortable"
        icon="mdi-delete-outline"
        size="small"
        variant="text"
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
