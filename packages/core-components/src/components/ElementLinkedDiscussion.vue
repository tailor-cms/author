<template>
  <VMenu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="left"
    max-width="350"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <VBtn
        v-tooltip:left="{ text: 'Comments disabled', openDelay: 1000 }"
        v-bind="menuProps"
        aria-label="Comments disabled"
        icon="mdi-comment-off-outline"
        size="x-small"
        variant="tonal"
      />
    </template>
    <VSheet :theme="$vuetify.theme.global.name" min-width="220" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-label-medium">
        Comments are only available on the source
      </div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-4">
        <VProgressCircular color="primary" indeterminate size="24" />
      </div>
      <VList v-else density="compact" nav>
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
  'source:view': [sourceInfo: ElementSourceInfo];
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
