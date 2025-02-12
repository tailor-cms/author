<template>
  <AssessmentItem
    :element="assessment"
    :expanded="expanded"
    :draggable="true"
    @selected="expanded = !expanded"
    @save="save"
    @delete="$emit('delete')">
    <template #header>
      <VRow v-if="objectives.length" justify="end" no-gutters class="mt-2">
        <VCol cols="5">
          <VAutocomplete
            v-model="objective"
            :items="objectives"
            :placeholder="objectiveLabel"
            item-title="data.name"
            variant="outlined"
            hide-details
            return-object
          />
        </VCol>
      </VRow>
    </template>
  </AssessmentItem>
</template>

<script lang="ts" setup>
import { AssessmentItem } from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import find from 'lodash/find';
import get from 'lodash/get';
import { onMounted, ref } from 'vue';
import set from 'lodash/set';

const props = defineProps<{
  assessment: ContentElement;
  objectives: Activity[];
  objectiveLabel: string;
}>();
const emit = defineEmits(['save', 'delete']);

const expanded = ref(!props.assessment.id);
const objective = ref<Activity | null>(null);

const save = (assessment: Record<string, any>) => {
  set(assessment, 'refs.objectiveId', get(objective.value, 'id', null));
  emit('save', assessment);
};

onMounted(() => {
  const objectiveId = get(props.assessment, 'refs.objectiveId') as number;
  if (!objectiveId) return;
  objective.value = find(props.objectives, { id: objectiveId }) ?? null;
});
</script>
