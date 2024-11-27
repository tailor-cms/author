<!-- eslint-disable vue/no-undef-components -->
<template>
  <VCard class="question-container bg-grey-lighten-5">
    <VToolbar class="px-4" color="primary-darken-3" height="36">
      <VIcon :icon="icon" color="secondary-lighten-2" size="18" start />
      <span class="text-subtitle-2">{{ name }}</span>
    </VToolbar>
    <VForm ref="form" class="content" validate-on="submit">
      <VSheet class="pa-4" color="primary-lighten-5">
        <div class="text-subtitle-2 mb-2">Question</div>
        <VInput
          :model-value="elementData.question"
          :rules="[(val) => !!val?.length || 'Please define question']"
        >
          <VAlert
            v-if="!elementData.question?.length"
            :text="
              isDisabled
                ? 'No question elements added.'
                : 'Click the button below to add question element.'
            "
            class="w-100"
            color="primary-darken-2"
            icon="mdi-information-variant"
            variant="tonal"
            prominent
          />
          <EmbeddedContainer
            :add-element-options="{
              large: true,
              label: 'Add question element',
            }"
            :container="elementData as any"
            :is-disabled="isDisabled"
            class="text-right w-100"
            @delete="deleteEmbed($event.id)"
            @save="saveQuestion($event.embeds)"
          />
        </VInput>
      </VSheet>
      <VCardText>
        <slot></slot>
        <div class="text-subtitle-2 mb-2">Hint</div>
        <VTextField
          :model-value="elementData.hint"
          placeholder="Optional hint..."
          variant="outlined"
          clearable
          @update:model-value="emit('update', { hint: $event })"
        />
        <Feedback
          v-if="showFeedback"
          :answers="elementData.answers"
          :feedback="elementData.feedback"
          :is-editing="!isDisabled"
          :is-graded="isGraded"
          @update="emit('update', { feedback: $event })"
        />
      </VCardText>
      <VCardActions class="d-flex justify-end pa-4 pt-0">
        <VBtn
          :disabled="!isDirty"
          color="primary-darken-4"
          variant="text"
          @click="cancel"
        >
          Cancel
        </VBtn>
        <VBtn
          :disabled="!isDirty"
          class="ml-2"
          color="primary-darken-3"
          variant="tonal"
          @click="save"
        >
          Save
        </VBtn>
      </VCardActions>
    </VForm>
  </VCard>
</template>

<script lang="ts" setup>
import { defineProps, ref } from 'vue';
import map from 'lodash/map';
import omit from 'lodash/omit';
import sortBy from 'lodash/sortBy';
import without from 'lodash/without';

import Feedback from './QuestionFeedback.vue';

const props = defineProps<{
  elementData: Record<string, any>;
  name: string;
  icon: string;
  showFeedback: boolean;
  isDisabled: boolean;
  isDirty: boolean;
  isGraded: boolean;
}>();
const emit = defineEmits(['cancel', 'delete', 'save', 'update']);

const form = ref();

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

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (valid) emit('save');
};

const cancel = () => {
  emit('cancel');
};
</script>

<style lang="scss" scoped>
:deep(.v-input__control) {
  flex-wrap: wrap;
}
</style>
