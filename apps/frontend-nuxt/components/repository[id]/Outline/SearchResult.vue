<template>
  <VHover>
    <template #default="{ isHovering, props }">
      <VCard
        v-bind="props"
        :color="`primary${isSelected || isHovering ? '' : '-darken-4'}`"
        :ripple="false"
        class="mt-6 py-1 text-left"
        variant="tonal"
        min-height="160"
        rounded="6"
        @click="$emit('select')"
      >
        <VCardSubtitle class="pt-5 d-flex align-center">
          <VChip
            :color="color"
            class="readonly mr-2 text-body-2"
            size="small"
            variant="flat"
            rounded
          >
            {{ typeLabel }}
          </VChip>
          <VChip
            class="readonly px-4 text-subtitle-2"
            color="teal-accent-2"
            rounded
            size="small"
            variant="tonal"
          >
            {{ activity.shortId }}
          </VChip>
        </VCardSubtitle>
        <VCardTitle class="pt-3 pl-5 text-h5 text-primary-lighten-4">
          {{ activity.data.name }}
        </VCardTitle>
        <VCardActions class="py-1 pl-3">
          <VBtn
            @mousedown.stop="$emit('show')"
            variant="text"
            color="secondary-lighten-3"
          >
            Go to
            <VIcon small class="pl-1">mdi-arrow-right</VIcon>
          </VBtn>
        </VCardActions>
      </VCard>
    </template>
  </VHover>
</template>

<script lang="ts" setup>
import find from 'lodash/find';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps({
  activity: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
});

const store = useCurrentRepository();
const config = computed(() =>
  find(store.taxonomy, { type: props.activity.type }),
);
const color = computed(() => config.value.color);
const typeLabel = computed(() => config.value.label);
</script>

<style lang="scss" scoped>
.v-card {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
</style>
