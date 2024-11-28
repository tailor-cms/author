<template>
  <div>
    <div class="text-subtitle-2 mb-2">Question</div>
    <VInput
      :model-value="elementData.question"
      :rules="[requiredRule]"
      hide-details="auto"
    >
      <VAlert
        v-if="!elementData.question?.length"
        :text="alertMsg"
        class="w-100 ma-4"
        color="primary-darken-2"
        icon="mdi-information-variant"
        variant="tonal"
        prominent
      />
      <EmbeddedContainer
        :add-element-options="addElementOptions"
        :container="elementData"
        :is-disabled="isDisabled"
        :types="allowedTypes"
        dense
        class="text-right w-100"
        @delete="deleteEmbed($event.id)"
        @save="saveQuestion($event.embeds)"
      />
    </VInput>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import map from 'lodash/map';
import omit from 'lodash/omit';
import sortBy from 'lodash/sortBy';
import without from 'lodash/without';

const addElementOptions = {
  large: true,
  label: 'Add question element',
  variant: 'text',
};

const props = defineProps<{
  elementData: Record<string, any>;
  isDisabled: boolean;
  allowedTypes: string[];
}>();
const emit = defineEmits(['update']);

const alertMsg = computed(() => {
  return props.isDisabled
    ? 'No question elements added.'
    : 'Click the button below to add question element.';
});

const saveQuestion = (embeds: any) => {
  const question = map(sortBy(embeds, 'position'), 'id');
  emit('update', { question, embeds });
};

const deleteEmbed = (id: string) => {
  const { embeds, question } = props.elementData;
  emit('update', {
    embeds: omit(embeds, id),
    question: without(question, id),
  });
};

const requiredRule = (val: string[]) => {
  return !!val?.length || 'Please define question';
};
</script>
