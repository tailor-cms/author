<template>
  <VSheet class="changes-panel" color="surface" rounded="lg" elevation="1">
    <VListSubheader class="changes-header border-b" color="text-medium-emphasis">
      Changes
    </VListSubheader>
    <VList class="changes-list py-0" bg-color="transparent">
      <VHover
        v-for="(revision, index) in revisions"
        :key="revision.id"
        v-slot="{ isHovering, props: hoverProps }"
      >
        <VListItem
          v-bind="hoverProps"
          :active="isSelected(revision)"
          :subtitle="revision.user?.label"
          :title="formatDate(revision)"
          class="position-relative"
          lines="two"
          @click="$emit('preview', revision)"
        >
          <template v-if="isHovering" #append>
            <VTooltip
              :disabled="!isRollbackDisabled"
              location="bottom"
              text="Unavailable while Renoir is generating"
            >
              <template #activator="{ props: tooltipProps }">
                <span v-bind="tooltipProps">
                  <VBtn
                    v-show="!isDetached && index > 0 && !loading[revision.id]"
                    :disabled="isRollbackDisabled"
                    class="rollback"
                    density="comfortable"
                    icon="mdi-restore"
                    size="small"
                    variant="tonal"
                    @click="$emit('rollback', revision)"
                  />
                </span>
              </template>
            </VTooltip>
          </template>
          <VProgressLinear v-if="loading[revision.id]" indeterminate />
        </VListItem>
      </VHover>
    </VList>
  </VSheet>
</template>

<script lang="ts" setup>
import { formatDate as format } from '@vueuse/core';
import type { Revision } from '@tailor-cms/interfaces/revision';

interface Props {
  revisions?: Revision[];
  loading: Record<string, boolean>;
  selected?: Revision | null;
  isDetached?: boolean;
  isRollbackDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  revisions: () => [],
  selected: null,
  isDetached: false,
  isRollbackDisabled: false,
});
defineEmits(['preview', 'rollback']);

const isSelected = ({ id }: Revision) => props.selected?.id === id;
const formatDate = ({ createdAt }: Revision) => {
  return format(new Date(createdAt), 'M/D/YY h:mm A');
};
</script>

<style lang="scss" scoped>
.changes-panel {
  display: flex;
  flex-direction: column;
  max-height: 32rem;
  overflow: hidden;
}

.changes-header {
  flex: none;
}

.changes-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.v-progress-linear {
  position: absolute;
  top: unset;
  bottom: 0;
  left: 0;
}
</style>
