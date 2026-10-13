<template>
  <VMenu
    v-model="menuOpen"
    :close-on-content-click="false"
    class="element-linked-indicator"
    location="left"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <ElementLinkedChip v-bind="menuProps" class="mr-1" is-interactive />
    </template>
    <VSheet :theme="$vuetify.theme.global.name" min-width="220" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-label-medium">Linked Element</div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-4">
        <VProgressCircular color="primary" size="24" indeterminate />
      </div>
      <VList v-else density="compact" nav>
        <VListItem
          :disabled="!sourceInfo"
          :subtitle="sourceInfo?.outlineActivityName || 'Open source location'"
          prepend-icon="mdi-open-in-new"
          title="View Source"
          @click="onViewSource"
        />
        <VListItem
          prepend-icon="mdi-link-variant-off"
          subtitle="Convert to local copy"
          title="Unlink"
          @click="onUnlink"
        />
      </VList>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import type { ElementSourceInfo } from '@tailor-cms/interfaces/content-element';
import { watch } from 'vue';

import ElementLinkedChip from './ElementLinkedChip.vue';

interface Props {
  sourceInfo?: ElementSourceInfo | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sourceInfo: null,
  isLoading: false,
});

const emit = defineEmits<{
  'unlink': [];
  'source:fetch': [];
  'source:view': [sourceInfo: ElementSourceInfo];
}>();

const menuOpen = defineModel<boolean>('open', { default: false });

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

const onUnlink = () => {
  emit('unlink');
  menuOpen.value = false;
};
</script>
