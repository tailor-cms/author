<template>
  <div v-if="models.length <= 1" class="text-body-medium font-weight-bold">
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
          Scoring model
        </VListSubheader>
        <VListItem
          v-for="model in models"
          :key="model.id"
          :active="model.id === modelValue"
          color="tertiary"
          class="mx-2"
          rounded="lg"
          @click="$emit('update:modelValue', model.id)"
        >
          <VListItemTitle class="text-body-small font-weight-bold">
            {{ model.name }}
          </VListItemTitle>
          <VListItemSubtitle class="text-body-small">
            {{ model.description }}
          </VListItemSubtitle>
          <div class="text-label-small text-medium-emphasis mt-1">
            {{ model.dimensions.length }} dimensions ·
            {{ maxScoreOf(model) }} points
          </div>
          <template #append>
            <VIcon
              v-if="model.id === modelValue"
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
import type { ScoringModelSummary } from '@tailor-cms/interfaces/feedback';

const props = defineProps<{
  modelValue: string | null;
  models: ScoringModelSummary[];
}>();

defineEmits(['update:modelValue']);

const selected = computed(() =>
  props.models.find((it) => it.id === props.modelValue),
);

const maxScoreOf = (model: ScoringModelSummary) =>
  model.dimensions.reduce((acc, it) => acc + it.maxScore, 0);
</script>

<style lang="scss" scoped>
.picker-btn {
  margin-left: -0.5rem;
  letter-spacing: normal;
}
</style>
