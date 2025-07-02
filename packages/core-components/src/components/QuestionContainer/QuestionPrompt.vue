<template>
  <div class="mb-4">
    <div class="text-subtitle-2 mb-2">Question</div>
    <VInput
      :model-value="elementData.question"
      :rules="[requiredRule]"
    >
      <div
        ref="question"
        class="question rounded w-100"
        :class="{ focused: isFocused }"
      >
        <VAlert
          v-if="!size(elementData.embeds)"
          :text="alertMsg"
          class="mx-6 mt-4 mb-2 text-center"
          color="primary-darken-1"
          icon="mdi-information-outline"
          variant="tonal"
          prominent
        />
        <TailorEmbeddedContainer
          :add-element-options="{
            label: 'Add question element',
            large: true,
            variant: 'text',
          }"
          :container="elementData"
          :is-readonly="isReadonly"
          :allowed-element-config="allowedElementConfig"
          class="text-center"
          dense
          @delete="deleteEmbed($event.id)"
          @save="saveQuestion($event.embeds)"
        />
      </div>
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
  margin-top: 1rem !important;

  .v-btn {
    margin-top: 0 !important;
    margin-bottom: 0.5rem !important;
  }
}

:deep(.list-group) {
  padding: 1rem 2.5rem;

  .contained-content {
    margin: 0;
  }
}

:deep(.v-input__details) {
  padding-inline: 1rem;
}

.question {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    height: 100%;
    left: 0;
    top: 0;
    width: 100%;
    border: 1px solid currentColor;
    opacity: 0.38;
    pointer-events: none;
    border-radius: inherit;
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &.focused::after {
    opacity: 1;
    border-width: 2px;
  }

  &:hover::after {
    opacity: 0.87;
  }
}

.v-input--error .question::after {
  color: rgb(var(--v-theme-error));
  opacity: 1;
}
</style>
