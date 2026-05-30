<template>
  <VHover>
    <template #default="{ isHovering, props: hoverProps }">
      <VCard
        v-bind="hoverProps"
        :color="isSelected || isHovering ? 'surface-container' : 'transparent'"
        :ripple="false"
        class="search-result mt-4 py-1 text-left"
        min-height="160"
        variant="flat"
        @click="$emit('select')"
      >
        <VCardSubtitle class="pt-5 d-flex align-center">
          <LabelChip color="inverse-surface" variant="flat">
            {{ typeLabel }}
          </LabelChip>
          <LabelChip class="ml-3" color="secondary" variant="flat">
            {{ activity.shortId }}
          </LabelChip>
        </VCardSubtitle>
        <VCardTitle class="pt-3 pl-5 text-headline-small">
          <ActivityName :activity="activity" />
        </VCardTitle>
        <VCardActions class="pb-2 pl-3">
          <VBtn
            :slim="false"
            append-icon="mdi-arrow-right"
            text="Go to"
            variant="tonal"
            size="small"
            @mousedown.stop="$emit('show')"
          />
        </VCardActions>
      </VCard>
    </template>
  </VHover>
</template>

<script lang="ts" setup>
import { find } from 'lodash-es';

import ActivityName from '@/components/common/ActivityName.vue';
import LabelChip from '@/components/common/LabelChip.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  activity: StoreActivity;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isSelected: false });
defineEmits(['select', 'show']);

const store = useCurrentRepository();

const config = computed(() =>
  find(store.taxonomy, { type: props.activity.type }),
);
const typeLabel = computed(() => config.value?.label);
</script>
