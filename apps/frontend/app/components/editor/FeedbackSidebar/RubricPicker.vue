<template>
  <div v-if="rubrics.length <= 1" class="text-body-medium font-weight-bold">
    {{ selected?.name ?? 'Content feedback' }}
  </div>
  <VMenu v-else offset="6">
    <template #activator="{ props: activatorProps }">
      <VBtn
        v-bind="activatorProps"
        class="picker-btn px-3"
        append-icon="mdi-menu-down"
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
          Scoring rubric
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
  margin-left: -0.5rem;
  letter-spacing: normal;
}
</style>
