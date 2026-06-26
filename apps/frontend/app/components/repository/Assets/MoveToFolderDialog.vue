<template>
  <TailorDialog
    v-model="show"
    :title="title"
    header-icon="mdi-folder-move-outline"
    width="480"
    @close="show = false"
  >
    <template #body>
      <VCombobox
        v-model="destination"
        :items="folders"
        class="move-folder-input"
        hint="Leave empty to move to the library root."
        label="Destination folder"
        placeholder="Pick a folder or type a new path"
        prepend-inner-icon="mdi-folder-outline"
        variant="outlined"
        clearable
        persistent-hint
        @keyup.enter="submit"
      />
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="show = false" />
      <VBtn
        color="primary"
        text="Move"
        variant="flat"
        @click="submit"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

const props = defineProps<{
  // Existing folder paths to offer as suggestions.
  folders: string[];
  // How many assets are being moved (for the title).
  count: number;
}>();

const emit = defineEmits<{
  // Chosen destination path; '' means the library root.
  move: [folder: string];
}>();

const show = defineModel<boolean>({ default: false });

const destination = ref<string | null>('');

const title = computed(() =>
  props.count === 1 ? 'Move asset' : `Move ${props.count} assets`,
);

watch(show, (isOpen) => {
  if (isOpen) destination.value = '';
});

function submit() {
  emit('move', (destination.value ?? '').trim());
  show.value = false;
}
</script>
