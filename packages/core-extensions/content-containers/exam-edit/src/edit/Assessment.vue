<template>
  <AssessmentItem
    :element="assessment"
    :expanded="expanded"
    :is-disabled="isDisabled"
    :is-dirty="isDirty"
    class="ml-2 mr-3"
    draggable
    @delete="$emit('delete')"
    @save="save"
    @selected="expanded = !expanded"
  >
    <template #header>
      <div v-if="objectives.length" class="d-flex px-6 py-4">
        <VRow justify="end" no-gutters class="mt-2">
          <VCol cols="5">
            <VAutocomplete
              v-model="objectiveId"
              :disabled="isDisabled"
              :items="objectives"
              :placeholder="objectiveLabel"
              item-title="data.name"
              item-value="id"
              variant="outlined"
              hide-details
              clearable
            />
          </VCol>
        </VRow>
      </div>
    </template>
  </AssessmentItem>
</template>

<script lang="ts" setup>
import { AssessmentItem } from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { get } from 'lodash-es';
import { ref } from 'vue';

const objectiveEntity = 'Activity';

const props = defineProps<{
  assessment: ContentElement;
  objectives: Activity[];
  objectiveLabel: string;
  isDisabled: boolean;
}>();
const emit = defineEmits(['save', 'delete']);

const expanded = ref(!props.assessment.id);
const objectiveId = ref<number | null>(null);

const isDirty = computed(() => {
  return objectiveId.value !== get(props.assessment, 'refs.objective.id', null);
});

const save = (assessment: Record<string, any>) => {
  if (isDirty.value) {
    const objective = objectiveId.value
      ? { id: objectiveId.value, entity: objectiveEntity }
      : undefined;
    assessment.refs.objective = objective;
  }
  emit('save', assessment);
};
</script>
