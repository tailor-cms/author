<template>
  <VListItem
    :active="isSelected"
    :ripple="false"
    class="search-result bg-surface-raised"
    density="compact"
    elevation="1"
    lines="three"
    link
    rounded="lg"
    @click="emit('toggle')"
  >
    <template #prepend>
      <VCheckboxBtn
        :model-value="isSelected"
        class="mr-3"
        color="primary"
        density="compact"
        @click.stop="emit('toggle')"
      />
      <VAvatar rounded="lg" size="44" variant="tonal">
        <VImg
          v-if="suggestion.thumbnailUrl"
          :src="suggestion.thumbnailUrl"
          cover
        />
        <VIcon v-else :color="typeColor" :icon="typeIcon" size="22" />
      </VAvatar>
    </template>
    <VListItemTitle class="text-title-small font-weight-semibold text-truncate">
      {{ suggestion.title }}
    </VListItemTitle>
    <VListItemSubtitle>
      <div class="snippet text-body-medium text-medium-emphasis">
        {{ suggestion.snippet }}
      </div>
      <div
        class="d-flex align-center flex-wrap text-label-medium text-medium-emphasis mt-1"
      >
        <span>
          <VIcon :color="typeColor" :icon="typeIcon" size="14" start />
          <span class="text-capitalize">{{ suggestion.type }}</span>
        </span>
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
    </VListItemSubtitle>
    <template #append>
      <VBtn
        :href="suggestion.url"
        icon="mdi-open-in-new"
        size="small"
        target="_blank"
        variant="text"
        @click.stop
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import type { DiscoveryResult } from '@tailor-cms/interfaces/discovery';

import { TYPE_COLOR, TYPE_ICON } from '../../constants';

const props = defineProps<{
  suggestion: DiscoveryResult;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const typeIcon = computed(() => TYPE_ICON[props.suggestion.type]);
const typeColor = computed(() => TYPE_COLOR[props.suggestion.type]);

const domain = computed(() => {
  try {
    return new URL(props.suggestion.url).hostname;
  } catch {
    return props.suggestion.url;
  }
});
</script>

<style lang="scss" scoped>
.search-result {
  padding-left: 0.5rem;
}

.snippet {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}
</style>
