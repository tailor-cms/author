<template>
  <TailorDialog
    v-model="show"
    header-icon="mdi-link-plus"
    width="480"
    @close="show = false"
  >
    <template #header>Add Link</template>
    <template #body>
      <VTextField
        v-model="url"
        :error-messages="urlError"
        hide-details="auto"
        label="URL"
        placeholder="https://example.com"
        prepend-inner-icon="mdi-link"
        variant="outlined"
        @keyup.enter="submit"
      />
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="show = false" />
      <VBtn text="Add" variant="tonal" @click="submit" />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

const emit = defineEmits<{
  add: [url: string];
}>();

const show = defineModel<boolean>({ default: false });

const url = ref('');
const urlError = ref('');

const isValid = computed(() => URL.canParse(url.value));

watch(show, (v) => {
  if (!v) return;
  url.value = '';
  urlError.value = '';
});

function submit() {
  if (!isValid.value) {
    urlError.value = 'Please enter a valid URL';
    return;
  }
  emit('add', url.value);
  show.value = false;
}
</script>
