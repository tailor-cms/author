<template>
  <VBtn
    v-tooltip:top="'Attach a file'"
    :disabled="disabled"
    aria-label="Attach a file"
    class="mr-1"
    density="comfortable"
    icon="mdi-paperclip"
    size="small"
    variant="text"
    @click="fileInput?.click()"
  />
  <input
    ref="fileInput"
    class="d-none"
    type="file"
    multiple
    @change="attach"
  >
</template>

<script lang="ts" setup>
import { ref } from 'vue';

defineProps<{ disabled?: boolean }>();

const emit = defineEmits<{ attach: [files: File[]] }>();

const fileInput = ref<HTMLInputElement>();

const attach = () => {
  const input = fileInput.value!;
  emit('attach', Array.from(input.files ?? []));
  input.value = '';
};
</script>
