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
            :class="{ 'nested-link': !isEntryPoint }"
            :variant="isEntryPoint ? 'tonal' : 'text'"
            color="info"
            icon="mdi-link-variant"
            size="x-small"
          />
        </template>
        <span v-if="isEntryPoint">Linked content</span>
        <span v-else>Part of linked activity - synced via parent</span>
      </VTooltip>
    </template>
    <VSheet min-width="220" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-caption text-medium-emphasis">
        {{ isEntryPoint ? 'Linked Element' : 'Nested Linked Element' }}
      </div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-4">
        <VProgressCircular color="primary" indeterminate size="24" />
      </div>
      <VList v-else density="compact">
        <VListItem
          :disabled="!sourceInfo"
          :subtitle="sourceInfo?.sourceActivityName || 'Open source location'"
          prepend-icon="mdi-open-in-new"
          title="View Source"
          @click="onViewSource"
        />
        <template v-if="isEntryPoint">
          <VDivider class="my-1" />
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
import { ref, watch } from 'vue';

interface SourceInfo {
  sourceId: number;
  sourceUid?: string;
  sourceRepositoryId: number;
  sourceActivityId: number;
  sourceOutlineActivityId: number;
  sourceActivityName?: string;
}

interface Props {
  sourceInfo?: SourceInfo | null;
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

const onUnlink = () => {
  emit('unlink');
  menuOpen.value = false;
};
</script>

<style lang="scss" scoped>
.nested-link {
  opacity: 0.6;
}
</style>
