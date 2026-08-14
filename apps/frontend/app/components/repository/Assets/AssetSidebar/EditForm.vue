<template>
  <VTextField
    v-model="nameInput"
    :error-messages="errors"
    class="mb-5"
    label="Name"
    variant="outlined"
    hide-details="auto"
    @update:model-value="onNameInput"
  />
  <VSwitch
    v-model="isCoreSource"
    class="mb-4 ml-2"
    color="secondary"
    label="Core Source"
    hide-details
  />
  <VTextarea
    v-model="description"
    class="mb-5"
    label="Description"
    variant="outlined"
    hide-details
  />
  <VCombobox
    v-model="tags"
    label="Tags"
    variant="outlined"
    closable-chips
    chips
    hide-details
    multiple
  />
</template>

<script lang="ts" setup>
import { string } from 'yup';
import { useField } from 'vee-validate';

const name = defineModel<string>('name', { required: true });
const isCoreSource = defineModel<boolean>('isCoreSource', { required: true });
const description = defineModel<string>('description', { required: true });
const tags = defineModel<string[]>('tags', { required: true });

const {
  value: nameInput,
  errors,
  validate,
  resetField,
} = useField('name', string().trim().required(), {
  initialValue: name.value,
});

const onNameInput = async () => {
  const { valid } = await validate();
  if (valid) name.value = nameInput.value.trim();
};

// Reset (not just reassign) on asset switch so a stale "required" error from
// a previously-emptied field doesn't carry over to the newly loaded asset.
watch(name, (val) => {
  if (val !== nameInput.value) resetField({ value: val });
});
</script>
