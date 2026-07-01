<template>
  <VDivider class="my-1 mr-1 pl-3" vertical />
  <VBtn
    v-if="canCreate"
    :text="`Create ${entityLabel}`"
    prepend-icon="mdi-plus"
    size="x-small"
    variant="text"
    @click="open"
  />
  <TailorDialog
    v-model="show"
    :theme="globalTheme"
    :title="`Create ${entityLabel}`"
    data-testid="createRelatedRecordDialog"
    header-icon="mdi-plus"
    @submit="submit"
  >
    <template #body>
      <VTextField
        v-model="title"
        :disabled="isCreating"
        :error-messages="errors.title"
        :label="titleLabel"
        variant="outlined"
        autofocus
      />
      <VAlert
        v-if="createError"
        :text="createError"
        density="compact"
        type="error"
        variant="tonal"
      />
    </template>
    <template #actions>
      <VSpacer />
      <VBtn text="Cancel" variant="text" @click="show = false" />
      <VBtn
        :loading="isCreating"
        color="primary"
        text="Create"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';
import { useTheme } from 'vuetify';

const schemaService = inject('$schemaService', null);
const createActivity = inject('$createActivity', null);

const emit = defineEmits(['created']);

const props = defineProps({
  // The ActivityRelationship config (allowedTypes, label).
  config: { type: Object, required: true },
  isDisabled: { type: Boolean, default: false },
});

const vuetifyTheme = useTheme();
const globalTheme = computed(() => vuetifyTheme.global.name.value);

const targetType = computed(() => {
  const allowedTypes = props.config.allowedTypes ?? [];
  return allowedTypes.length === 1 ? allowedTypes[0] : null;
});

const canCreate = computed(
  () => !props.isDisabled && !!targetType.value && !!createActivity,
);

const entityLabel = computed(
  () => schemaService?.getLevel?.(targetType.value)?.label ?? props.config.label,
);

const titleMeta = computed(() => {
  const meta = schemaService?.getActivityMetadata?.({ type: targetType.value }) ?? [];
  return meta.find((it) => it.key === 'name') ?? meta[0] ?? {};
});

const titleLabel = computed(() => titleMeta.value.label || 'Name');

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: computed(() => ({ title: titleMeta.value.validate ?? {} })),
});

const [title] = defineField('title');

const show = ref(false);
const isCreating = ref(false);
const createError = ref('');

const open = () => {
  createError.value = '';
  resetForm();
  show.value = true;
};

const submit = handleSubmit(async (values) => {
  if (!createActivity) return;
  isCreating.value = true;
  createError.value = '';
  try {
    const created = await createActivity({
      type: targetType.value,
      data: { name: values.title.trim() },
    });
    if (created?.id) emit('created', created.id);
    show.value = false;
  } catch {
    createError.value = `Failed to create ${entityLabel.value}`;
  } finally {
    isCreating.value = false;
  }
});
</script>
