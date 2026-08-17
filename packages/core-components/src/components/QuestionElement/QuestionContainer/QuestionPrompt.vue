<template>
  <div class="my-4">
    <VInput
      :model-value="elementData.question"
      :rules="[requiredRule]"
    >
      <template #default="{ isValid }">
        <VField
          :error="!isValid.value"
          class="w-100"
          label="Prompt"
          variant="outlined"
          active
        >
          <div
            class="w-100 mx-2"
            :class="{ focused: isFocused }"
          >
            <VAlert
              v-if="!size(elementData.embeds)"
              :text="alertMsg"
              class="mx-4 mt-4 mb-n2 text-center"
              icon="mdi-information-outline"
              variant="tonal"
              prominent
            />
            <TailorEmbeddedContainer
              :add-element-options="{
                label: 'Add element',
                large: true,
                variant: 'text',
              }"
              :container="elementData"
              :is-readonly="isReadonly"
              :allowed-element-config="allowedElementConfig"
              class="text-center w-100"
              @delete="deleteEmbed($event.id)"
              @save="saveQuestion($event.embeds)"
            />
          </div>
        </VField>
      </template>
    </VInput>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { map, omit, size, sortBy, without } from 'lodash-es';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

const props = defineProps<{
  elementData: Record<string, any>;
  isReadonly: boolean;
  allowedElementConfig: ContentElementCategory[];
}>();
const emit = defineEmits(['update']);

const eventBus = inject<any>('$eventBus');
const editorChannel = eventBus.channel('editor');

const isFocused = ref(false);

const alertMsg = computed(() => {
  return props.isReadonly
    ? 'No question elements added.'
    : 'Click the button below to add a question element.';
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

editorChannel.on('element:focus', (element: any = {}) => {
  isFocused.value = props.elementData.question.includes(element?.id);
});
</script>

<style lang="scss" scoped>
:deep(.add-element-container) {
  margin-top: 1rem;

  .v-btn {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
}

:deep(.list-group) {
  .contained-content {
    margin: 0;
  }
}

:deep(.v-input__details) {
  padding-inline: 1rem;
}

.v-input--error .question::after {
  color: rgb(var(--v-theme-error));
  opacity: 1;
}
</style>
