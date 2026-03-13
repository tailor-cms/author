<template>
  <VMenu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="left"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <VTooltip :disabled="menuOpen" location="left" open-delay="1000">
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="{ ...menuProps, ...tooltipProps }"
            aria-label="Comments disabled"
            color="primary-darken-2"
            icon="mdi-comment-off-outline"
            size="x-small"
            variant="tonal"
          />
        </template>
        <span>Comments disabled</span>
      </VTooltip>
    </template>
    <VSheet min-width="220" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-caption text-medium-emphasis">
        Comments are only available on the source element
      </div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-4">
        <VProgressCircular color="primary" indeterminate size="24" />
      </div>
      <VList v-else density="compact">
        <VListItem
          :disabled="!sourceInfo"
          :subtitle="sourceInfo?.outlineActivityName || 'Open source location'"
          prepend-icon="mdi-open-in-new"
          title="View source"
          @click="onViewSource"
        />
      </VList>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import type { ElementSourceInfo } from '@tailor-cms/interfaces/content-element';
import { ref, watch } from 'vue';

interface Props {
  sourceInfo?: ElementSourceInfo | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sourceInfo: null,
  isLoading: false,
});

const emit = defineEmits<{
  'source:fetch': [];
  'source:view': [sourceInfo: SourceInfo];
}>();

const menuOpen = ref(false);

watch(menuOpen, (open) => {
  if (open && !props.sourceInfo && !props.isLoading) {
    emit('source:fetch');
  }
});

const onViewSource = () => {
  if (!props.sourceInfo) return;
  emit('source:view', props.sourceInfo);
  menuOpen.value = false;
};
</script>
