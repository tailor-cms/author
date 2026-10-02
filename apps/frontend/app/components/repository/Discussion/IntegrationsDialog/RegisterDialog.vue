<template>
  <TailorDialog
    v-model="isOpen"
    :persistent="!!issued"
    :title="issued ? 'Integration registered' : 'Register integration'"
    header-icon="mdi-webhook"
    width="560"
    @close="close"
    @submit="submit"
  >
    <template #body>
      <WebhookUrlPanel
        v-if="issued"
        :integration="issued.integration"
        :webhook-url="issued.webhookUrl"
      />
      <template v-else>
        <div class="text-body-medium text-medium-emphasis mb-4">
          Creates a sender with its own webhook URL, shown once after you
          register.
        </div>
        <VTextField
          v-model="name"
          :error-messages="errors.name"
          class="mb-3"
          hide-details="auto"
          label="Name"
          name="name"
          placeholder="e.g. CI pipeline"
          variant="outlined"
        />
        <VTextField
          v-model="key"
          :error-messages="errors.key"
          class="mb-3"
          hide-details="auto"
          hint="Unique in this repository; lowercase, numbers, - and _."
          label="Key"
          name="key"
          placeholder="e.g. ci-pipeline"
          variant="outlined"
          persistent-hint
          @update:model-value="isKeyEdited = true"
        />
        <VTextField
          v-model="icon"
          :error-messages="errors.icon"
          :prepend-inner-icon="iconPreview"
          :placeholder="DEFAULT_ICON"
          hide-details="auto"
          hint="Any Material Design icon name, shown beside its posts."
          label="Icon"
          name="icon"
          variant="outlined"
          persistent-hint
        />
      </template>
    </template>
    <template #actions>
      <VSpacer />
      <VBtn
        v-if="issued"
        color="primary"
        text="I've saved it"
        variant="flat"
        @click="close"
      />
      <template v-else>
        <VBtn text="Cancel" variant="text" @click="close" />
        <VBtn
          :loading="isSaving"
          color="primary"
          text="Register"
          type="submit"
          variant="flat"
        />
      </template>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { IssuedIntegration, RegisterInput } from './useIntegrations';
import { object, string } from 'yup';
import { kebabCase } from 'lodash-es';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';
import WebhookUrlPanel from './WebhookUrlPanel.vue';

const DEFAULT_ICON = 'mdi-webhook';
const KEY_MAX_LENGTH = 60;
const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const ICON_PATTERN = /^(mdi-[a-z0-9-]+)?$/;

const props = defineProps<{
  existingKeys: string[];
  isSaving: boolean;
  issued?: IssuedIntegration | null;
}>();

const emit = defineEmits<{
  'register:integration': [input: RegisterInput];
  'close': [];
}>();

const isOpen = defineModel<boolean>({ default: false });

const isTaken = (value?: string) =>
  props.existingKeys.includes((value ?? '').trim());

const { defineField, errors, handleSubmit, resetForm, setFieldValue } =
  useForm({
    validationSchema: object({
      name: string()
        .trim()
        .required('Enter a name')
        .max(120, 'Name is too long'),
      key: string()
        .trim()
        .required('Enter a key')
        .max(KEY_MAX_LENGTH, 'Key is too long')
        .matches(KEY_PATTERN, 'Use lowercase letters, numbers, - and _')
        .test('unique', 'This key is already taken', (it) => !isTaken(it)),
      icon: string()
        .trim()
        .max(60, 'Icon name is too long')
        .matches(ICON_PATTERN, `Use an icon name like ${DEFAULT_ICON}`),
    }),
  });

const [name] = defineField('name');
const [key] = defineField('key');
const [icon] = defineField('icon');

const isKeyEdited = ref(false);
const iconPreview = computed(() => icon.value || DEFAULT_ICON);

const close = () => {
  isOpen.value = false;
  emit('close');
};

const submit = handleSubmit((values) => {
  emit('register:integration', {
    key: values.key.trim(),
    name: values.name.trim(),
    icon: values.icon?.trim() || DEFAULT_ICON,
  });
});

watch(name, (value) => {
  if (isKeyEdited.value) return;
  const derived = kebabCase(value ?? '').slice(0, KEY_MAX_LENGTH);
  setFieldValue('key', derived, !!derived);
});

watch(isOpen, (open) => {
  if (!open) return;
  isKeyEdited.value = false;
  resetForm({ values: { icon: DEFAULT_ICON } });
});
</script>
