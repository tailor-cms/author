<template>
  <div class="flex-grow-1 overflow-hidden">
    <div class="text-title-medium font-weight-medium text-truncate">
      {{ suggestion.title }}
    </div>
    <div class="snippet text-title-small text-medium-emphasis">
      {{ suggestion.snippet }}
    </div>
    <div class="d-flex align-center text-body-medium text-medium-emphasis mt-1">
      <VIcon :color="color" :icon="icon" size="14" />
      <span class="text-capitalize ml-1">{{ suggestion.type }}</span>
      <VIcon icon="mdi-circle-small" size="x-small" />
      <span class="text-truncate">{{ domain }}</span>
      <template v-if="suggestion.author">
        <VIcon icon="mdi-circle-small" size="x-small" />
        <span class="text-truncate">{{ suggestion.author }}</span>
      </template>
      <template v-if="suggestion.license">
        <VIcon icon="mdi-circle-small" size="x-small" />
        <span>{{ suggestion.license }}</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DiscoveryResult } from '@tailor-cms/interfaces/discovery';

const props = defineProps<{
  suggestion: DiscoveryResult;
  icon: string;
  color: string;
}>();

const domain = computed(() => {
  try {
    return new URL(props.suggestion.url).hostname;
  } catch {
    return props.suggestion.url;
  }
});
</script>

<style lang="scss" scoped>
.snippet {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
