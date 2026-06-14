<template>
  <div>
    <div class="lens-label pa-2">Review lens</div>
    <div v-if="rubrics.length <= 1" class="text-body-medium font-weight-bold">
      {{ selected?.name ?? 'Content feedback' }}
    </div>
    <VMenu v-else offset="6">
      <template #activator="{ props: activatorProps }">
        <VBtn
          v-bind="activatorProps"
          class="picker-btn px-2"
          append-icon="mdi-menu-down"
          density="comfortable"
          variant="text"
        >
          <span class="text-body-medium font-weight-bold text-none">
            {{ selected?.name }}
          </span>
        </VBtn>
      </template>
      <VCard min-width="320" max-width="360" rounded="lg">
        <VList density="comfortable" lines="three" slim>
          <VListSubheader class="text-label-small">
            Choose a lens
          </VListSubheader>
          <VListItem
            v-for="rubric in rubrics"
            :key="rubric.id"
            :active="rubric.id === modelValue"
            color="tertiary"
            class="mx-2"
            rounded="lg"
            @click="$emit('update:modelValue', rubric.id)"
          >
            <VListItemTitle class="text-body-small font-weight-bold">
              {{ rubric.name }}
            </VListItemTitle>
            <VListItemSubtitle class="text-body-small">
              {{ rubric.description }}
            </VListItemSubtitle>
            <div class="text-label-small text-medium-emphasis mt-1">
              {{ rubric.dimensions.length }} dimensions ·
              {{ maxScoreOf(rubric) }} points
            </div>
            <template #append>
              <VIcon
                v-if="rubric.id === modelValue"
                color="tertiary"
                icon="mdi-check-circle"
                size="18"
              />
            </template>
          </VListItem>
        </VList>
      </VCard>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

const props = defineProps<{
  modelValue: string | null;
  rubrics: ScoringRubric[];
}>();

defineEmits(['update:modelValue']);

const selected = computed(() =>
  props.rubrics.find((it) => it.id === props.modelValue),
);

const maxScoreOf = (rubric: ScoringRubric) =>
  rubric.dimensions.reduce((acc, it) => acc + it.maxScore, 0);
</script>

<style lang="scss" scoped>
.picker-btn {
  letter-spacing: normal;
}

.lens-label {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
  opacity: 0.65;
}
</style>
