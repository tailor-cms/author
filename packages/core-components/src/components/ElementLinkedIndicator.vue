<template>
  <VMenu
    v-model="menuOpen"
    :close-on-content-click="false"
    class="element-linked-indicator"
    location="left"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <VBtn
        v-tooltip:left="{
          text: tooltipText,
          disabled: menuOpen,
          openDelay: 1000,
        }"
        v-bind="menuProps"
        :class="{ 'opacity-60': !isEntryPoint }"
        aria-label="Linked content"
        color="tertiary"
        icon="mdi-link-variant"
        size="x-small"
        variant="tonal"
      />
    </template>
    <VSheet :theme="$vuetify.theme.global.name" min-width="220" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-label-medium">
        {{ isEntryPoint ? 'Linked Element' : 'Nested Linked Element' }}
      </div>
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
        <template v-if="isEntryPoint">
          <VListItem
            prepend-icon="mdi-link-variant-off"
            subtitle="Convert to local copy"
            title="Unlink"
            @click="onUnlink"
          />
        </template>
      </VList>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import type { ElementSourceInfo } from '@tailor-cms/interfaces/content-element';
import { computed, ref, watch } from 'vue';

interface Props {
  sourceInfo?: ElementSourceInfo | null;
  isLoading?: boolean;
  isEntryPoint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sourceInfo: null,
  isLoading: false,
  isEntryPoint: true,
});

const emit = defineEmits<{
  'unlink': [];
  'source:fetch': [];
  'source:view': [sourceInfo: ElementSourceInfo];
}>();

const menuOpen = ref(false);

const tooltipText = computed(() =>
  props.isEntryPoint
    ? 'Linked content'
    : 'Part of linked activity - synced via parent',
);

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
