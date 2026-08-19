<template>
  <ContentElementWrapper
    :element="assessment"
    :expanded="expanded"
    :is-readonly="isReadonly"
    :is-dirty="isDirty"
    @delete="$emit('delete')"
    @save="save"
    @update:expanded="expanded = $event"
  >
    <div v-if="objectives.length || objectiveId" class="d-flex py-2">
      <VRow justify="end" no-gutters class="mt-2">
        <VCol cols="5">
          <VAutocomplete
            v-model="objectiveId"
            :disabled="isReadonly"
            :items="objectives"
            :placeholder="objectiveLabel"
            density="comfortable"
            item-title="data.name"
            item-value="id"
            variant="outlined"
            hide-details
            clearable
          />
        </VCol>
      </VRow>
    </div>
  </ContentElementWrapper>
</template>

<script lang="ts" setup>
import {
  ContentElement as ContentElementWrapper,
} from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { get } from 'lodash-es';
import { computed, ref } from 'vue';

const objectiveEntity = 'Activity';

const props = defineProps<{
  assessment: ContentElement;
  objectives: Activity[];
  objectiveLabel: string;
  isReadonly: boolean;
}>();
const emit = defineEmits(['save', 'delete']);

const expanded = ref(!props.assessment.id);
const objectiveId = ref<number | null>(
  get(props.assessment, 'refs.objective.id', null),
);

const isDirty = computed(() => {
  return objectiveId.value !== get(props.assessment, 'refs.objective.id', null);
});

const save = (data: ContentElement['data']) => {
  const objective = objectiveId.value
    ? { id: objectiveId.value, entity: objectiveEntity }
    : undefined;
  const refs = isDirty.value
    ? { ...props.assessment.refs, objective }
    : props.assessment.refs;
  emit('save', { ...props.assessment, data, refs });
};
</script>
