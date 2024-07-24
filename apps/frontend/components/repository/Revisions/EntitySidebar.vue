<template>
  <VList bg-color="primary-darken-3" class="rounded-lg pa-0" max-height="32rem">
    <VListSubheader color="white">Changes</VListSubheader>
    <VDivider />
    <VHover
      v-for="(revision, index) in revisions"
      :key="revision.id"
      v-slot="{ isHovering, props: hoverProps }"
    >
      <VListItem
        v-bind="hoverProps"
        :active="isSelected(revision)"
        :subtitle="revision.user.label"
        :title="formatDate(revision)"
        class="position-relative"
        lines="two"
        @click="$emit('preview', revision)"
      >
        <template v-if="isHovering" #append>
          <VBtn
            v-show="!isDetached && index > 0 && !loading[revision.id]"
            class="rollback"
            color="white"
            icon="mdi-restore"
            size="small"
            variant="tonal"
            @click="$emit('rollback', revision)"
          />
        </template>
        <VProgressLinear v-if="loading[revision.id]" indeterminate />
      </VListItem>
      <VDivider v-if="index < revisions.length - 1" />
    </VHover>
  </VList>
</template>

<script lang="ts" setup>
import { format } from 'fecha';
import type { Revision } from '@tailor-cms/interfaces/revision';

interface Props {
  revisions?: Revision[];
  loading: Record<string, boolean>;
  selected?: Revision | null;
  isDetached?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  revisions: () => [],
  selected: null,
  isDetached: false,
});
defineEmits(['preview', 'rollback']);

const isSelected = (revision: Revision) => props.selected?.id === revision.id;
const formatDate = (revision: Revision) => {
  return format(new Date(revision.createdAt), 'M/D/YY h:mm A');
};
</script>

<style lang="scss" scoped>
.v-progress-linear {
  position: absolute;
  top: unset !important;
  bottom: 0;
  left: 0;
}
</style>
