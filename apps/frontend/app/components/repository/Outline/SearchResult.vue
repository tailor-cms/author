<template>
  <VHover>
    <template #default="{ isHovering, props: hoverProps }">
      <VCard
        v-bind="hoverProps"
        :color="isSelected || isHovering ? '' : 'primary-darken-3'"
        :ripple="false"
        class="search-result mt-4 py-1 text-left"
        min-height="160"
        rounded="6"
        variant="tonal"
        @click="$emit('select')"
      >
        <VCardSubtitle class="pt-5 d-flex align-center">
          <LabelChip color="primary-lighten-5" variant="flat">
            {{ typeLabel }}
          </LabelChip>
          <LabelChip class="ml-3" color="teal-accent-2" variant="flat">
            {{ activity.shortId }}
          </LabelChip>
        </VCardSubtitle>
        <VCardTitle class="pt-3 pl-5 text-h5 text-primary-lighten-5">
          <ActivityName :activity="activity" />
        </VCardTitle>
        <VCardActions class="pb-2 pl-3">
          <VBtn
            class="px-2"
            color="teal-lighten-4"
            variant="text"
            @mousedown.stop="$emit('show')"
          >
            Go to
            <VIcon class="pl-1" small>mdi-arrow-right</VIcon>
          </VBtn>
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
const typeLabel = computed(() => config.value.label);

</script>

<style lang="scss" scoped>
.v-card {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.v-card:hover > :deep(.v-card__overlay) {
  opacity: 0.01;
}
</style>
