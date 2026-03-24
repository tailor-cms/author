<template>
  <VDialog v-model="show" max-width="480" scrollable>
    <VCard color="primary-darken-4">
      <VToolbar color="primary-darken-3" density="comfortable">
        <VToolbarTitle
          class="ml-4 text-body-1 font-weight-medium text-primary-lighten-4"
        >
          <VIcon class="mr-1" color="primary-lighten-3" icon="mdi-link-plus" />
          Add Link
        </VToolbarTitle>
        <template #append>
          <VBtn
            aria-label="Close"
            class="mr-1 text-primary-lighten-4"
            icon="mdi-close"
            @click="show = false"
          />
        </template>
      </VToolbar>
      <VDivider />
      <VCardText class="pa-5">
        <VTextField
          v-model="url"
          :error-messages="urlError"
          color="primary-lighten-3"
          density="comfortable"
          hide-details="auto"
          label="URL"
          placeholder="https://example.com"
          prepend-inner-icon="mdi-link"
          variant="outlined"
          @keyup.enter="submit"
        />
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4 ga-2">
        <VSpacer />
        <VBtn
          color="primary-lighten-3"
          variant="text"
          @click="show = false"
        >
          Cancel
        </VBtn>
        <VBtn
          :disabled="!isValid"
          color="primary-lighten-3"
          variant="tonal"
          @click="submit"
        >
          Add
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
const show = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  created: [url: string];
}>();

const url = ref('');
const urlError = ref('');

const isValid = computed(() => {
  try {
    new URL(url.value);
    return true;
  } catch {
    return false;
  }
});

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
  emit('created', url.value);
  show.value = false;
}
</script>
