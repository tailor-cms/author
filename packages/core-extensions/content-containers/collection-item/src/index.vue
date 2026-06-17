<template>
  <VCard theme="light" class="collection-item">
    <VCardText class="pa-8 pb-4 text-left">
      <MetaInput
        v-for="meta in entryMeta"
        :key="meta.key"
        :meta="{ ...meta, value: entryMetaValues[meta.key] }"
        :name="meta.key"
        :is-disabled="disabled"
        class="pb-4"
        hide-details="auto"
        @update="(e) => (entryMetaValues[meta.key] = e)"
      />
      <div v-for="input in config" :key="input.key">
        <Field
          v-if="input.isContentElement"
          v-slot="{ errorMessage }"
          :name="input.key"
          :rules="required(input.type, input.label)"
          :model-value="containerState[input.key].data"
        >
          <div
            class="label ma-1 text-body-small text-left"
            :class="{ 'text-error': errorMessage }">
            {{ input.label }}
          </div>
          <div
            :class="{ 'text-error': errorMessage }"
            class="element-container pb-4"
          >
            <ContainedContent
              :element="containerState[input.key]"
              :embed-element-config="embedElementConfig"
              :is-disabled="disabled"
              autosave
              @save="(e) => updateSlot(input.key, e)"
            />
            <div v-if="errorMessage" class="v-messages">
              <div class="v-messages__message pl-4">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </Field>
        <MetaInput
          v-else
          :meta="{ ...input, value: containerState[input.key] }"
          :name="input.key"
          :is-disabled="disabled"
          class="pb-4"
          hide-details="auto"
          @update="(e) => (containerState[input.key] = e)"
        />
      </div>
      <div v-if="relationships.length" class="relationships pt-2">
        <VDivider class="mb-5" />
        <div class="label pb-5 text-body-small font-weight-medium">
          Relationships
        </div>
        <Field
          v-for="rel in relationships"
          :key="rel.type"
          v-slot="{ errorMessage }"
          :name="`rel.${rel.type}`"
          :rules="validateRelationship(rel)"
          :model-value="refsState[rel.type]"
        >
          <CollectionRelationship
            :activities="activities"
            :config="rel"
            :error-message="errorMessage"
            :is-disabled="disabled"
            :model-value="refsState[rel.type]"
            :owner-id="container.parentId"
            @update="(ids) => (refsState[rel.type] = ids)"
          />
        </Field>
      </div>
    </VCardText>
    <VSlideYTransition>
      <VSheet
        v-if="!disabled && isDirty"
        color="surface-container-low"
        class="px-6 py-3 d-flex justify-end ga-2"
        border
      >
        <VBtn
          text="Cancel"
          variant="text"
          @click="reset"
        />
        <VBtn
          color="primary"
          prepend-icon="mdi-check"
          text="Save"
          variant="flat"
          @click="save"
        />
      </VSheet>
    </VSlideYTransition>
  </VCard>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element.js';
import type { Repository } from '@tailor-cms/interfaces/repository.js';
import { computed, inject, nextTick, ref, watch } from 'vue';
import { cloneDeep, isEqual, pick } from 'lodash-es';
import { Field, useForm } from 'vee-validate';
import { uuid } from '@tailor-cms/utils';

import { ContainedContent, useValidationProvider } from '@tailor-cms/core-components';
import CollectionRelationship from './CollectionRelationship.vue';
import MetaInput from './MetaInput.vue';

const { validate, resetForm } = useForm();
const { validate: validateItems, reset: resetItems } = useValidationProvider();

const ceRegistry = inject<any>('$ceRegistry');
const schemaService = inject<any>('$schemaService');

const required = (type: string, label: string) => (data: unknown) => {
  const isEmpty = ceRegistry.get(type)?.isEmpty;
  return isEmpty?.(data) ? `${label} is a required field` : true;
};

interface Props {
  repository: Repository;
  activities: Activity[];
  container: Activity;
  elements: Record<string, ContentElement>;
  config?: Record<number, any>;
  embedElementConfig?: any[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  config: () => ({}),
  embedElementConfig: () => [],
});

const emit = defineEmits<{
  'update:container': [container: any];
  'update:activity': [activity: any];
}>();

// The collection record this container belongs to. Its own activity holds the
// record-level metadata (the title); the container holds the content slots.
const entryActivity = computed(() =>
  (props.activities ?? []).find((it) => it.id === props.container.parentId),
);

// Entry-level metadata (the title), defined on the activity, not the container.
// Collection items have no details panel, so these are rendered as the first
// fields of the card and saved together with the container slots on Save.
const entryMeta = computed(
  () => schemaService?.getActivityMetadata?.(entryActivity.value) ?? [],
);

const readEntryMetaValues = () =>
  entryMeta.value.reduce((acc: Record<string, any>, meta: any) => {
    acc[meta.key] = entryActivity.value?.data?.[meta.key] ?? '';
    return acc;
  }, {});

const initialEntryMetaValues = ref<Record<string, any>>(readEntryMetaValues());

const entryMetaValues = ref<Record<string, any>>({ ...initialEntryMetaValues.value });

// Activity relationships (stored in refs) are edited and saved
// with everything else on Save;
const relationships = computed(
  () => schemaService?.getLevel?.(entryActivity.value?.type)?.relationships ?? [],
);

const readRefs = () =>
  relationships.value.reduce((acc: Record<string, any>, rel: any) => {
    acc[rel.type] = entryActivity.value?.refs?.[rel.type] ?? [];
    return acc;
  }, {});

const initialRefs = ref<Record<string, any>>(readRefs());

const refsState = ref<Record<string, any>>(cloneDeep(initialRefs.value));

const validateRelationship = (rel: any) => (value: unknown[]) => {
  if (rel.allowEmpty !== false) return true;
  return value?.length ? true : `${rel.label} is a required field`;
};

const initElement = (it: any, data: Record<PropertyKey, any> = {}) => {
  const { type, isGradable } = it;
  const { initState = () => ({}), isQuestion } = ceRegistry.get(type);
  const element = {
    id: uuid(),
    type,
    embedded: true,
    data: { width: 12, ...initState(), ...data },
  };
  if (isQuestion) {
    const id = uuid();
    const question = {
      id,
      data: { content: '' },
      type: 'TIPTAP_HTML',
      position: 1,
      embedded: true,
    };
    Object.assign(element.data, {
      embeds: { [id]: question },
      question: [id],
      isGradable,
    });
    if (!isGradable) delete element.data.correct;
  }
  return element;
};

// A stored content element whose component isn't registered
const isAvailableElement = (el: any) =>
  !!el && typeof el === 'object' && !!el.type && !!ceRegistry.get(el.type);

// Container-level slot values (the config fields); the editable buffer for
// this container's own data, distinct from the entry activity's meta/refs.
const initContainerState = () =>
  Object.values(props.config).reduce((acc: Record<string, any>, it) => {
    const stored = props.container.data?.[it.key];
    if (it.isContentElement) {
      acc[it.key] = isAvailableElement(stored) ? stored : initElement(it);
    } else {
      acc[it.key] = stored || it.defaultValue || '';
    }
    return acc;
  }, {});

const initialContainerState = ref(initContainerState());

const containerState = ref(cloneDeep(initialContainerState.value));

// The inner element editor has `autosave`, so it emits `@save` on every edit.
// We don't persist here; just capture the new data into the buffer, so slot
// edits are saved together with the rest on the card's explicit Save.
const updateSlot = (key: string, data: any) => {
  containerState.value[key] = { ...containerState.value[key], data };
};

const isDirty = computed(
  () =>
    !isEqual(containerState.value, initialContainerState.value) ||
    !isEqual(entryMetaValues.value, initialEntryMetaValues.value) ||
    !isEqual(refsState.value, initialRefs.value),
);

const save = async () => {
  // Two validation gates: vee-validate covers the top-level Field inputs
  // here; validateItems() runs validators that nested ContainedContent
  // children registered via useValidation. Both must pass.
  const [formResult, contentResult] = await Promise.all([
    validate(),
    validateItems(),
  ]);
  if (!formResult.valid || !contentResult.valid) return;
  // Title meta and relationships both live on the entry activity; persist them
  // together in a single update.
  const entry = entryActivity.value;
  const metaChanged = !isEqual(entryMetaValues.value, initialEntryMetaValues.value);
  const refsChanged = !isEqual(refsState.value, initialRefs.value);
  if (entry && (metaChanged || refsChanged)) {
    emit('update:activity', {
      id: entry.id,
      data: { ...entry.data, ...entryMetaValues.value },
      refs: { ...entry.refs, ...refsState.value },
    });
    initialEntryMetaValues.value = { ...entryMetaValues.value };
    initialRefs.value = cloneDeep(refsState.value);
  }
  emit('update:container', {
    ...pick(props.container, ['id', 'repositoryId']),
    data: containerState.value,
  });
  initialContainerState.value = cloneDeep(containerState.value);
};

const reset = async () => {
  containerState.value = cloneDeep(initialContainerState.value);
  entryMetaValues.value = { ...initialEntryMetaValues.value };
  refsState.value = cloneDeep(initialRefs.value);
  resetForm();
  await nextTick();
  resetItems();
};

watch(
  () => entryActivity.value?.data,
  () => {
    const latest = readEntryMetaValues();
    // Track external changes without clobbering an in-progress edit.
    if (isEqual(entryMetaValues.value, initialEntryMetaValues.value)) {
      entryMetaValues.value = { ...latest };
    }
    initialEntryMetaValues.value = latest;
  },
  { deep: true },
);

watch(
  () => entryActivity.value?.refs,
  () => {
    const latest = readRefs();
    // Track external changes without clobbering an in-progress edit.
    if (isEqual(refsState.value, initialRefs.value)) refsState.value = cloneDeep(latest);
    initialRefs.value = latest;
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.collection-item {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom) - 8rem);
}

.v-card-text {
  overflow-y: auto;
  min-height: 0;
}

.element-container {
  position: relative;
}

.label {
  opacity: 0.65;

  &.text-error {
    opacity: 1;
  }
}

.element-container > :deep(.contained-content) {
  // First level elements cannot be dragged
  > .drag-handle {
    display: none;
  }

  // First level elements cannot be deleted
  > .content-element > .element-actions {
    display: none;
  }

  > .content-element {
    border: none;
    position: relative;
    border-radius: 4px;

    &.frame {
      padding: 1rem;

      .tiptap {
        padding: 0;
      }
    }

    &::after {
      background: none;
      display: block;
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
}

.element-container.text-error {
  > :deep(.contained-content) > .content-element::after {
    opacity: 1;
  }

  > .v-messages {
    opacity: 1;
  }
}
</style>
