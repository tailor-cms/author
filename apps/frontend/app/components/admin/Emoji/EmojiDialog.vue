<template>
  <TailorDialog
    v-model="isOpen"
    header-icon="mdi-emoticon-plus-outline"
    title="Add a custom emoji"
    persistent
    @submit="submit"
  >
    <template #body>
      <p :id="hintId" class="text-body-small text-medium-emphasis mb-4">
        {{ IMAGE_HINT }}
      </p>
      <VInput :error-messages="fileError" class="mb-4" hide-details="auto">
        <template #default="{ messagesId }">
          <div class="d-flex flex-wrap align-center ga-4 w-100">
            <div class="d-flex ga-2">
              <VThemeProvider
                v-for="theme in THEMES"
                :key="theme"
                :theme="theme"
              >
                <VSheet
                  :aria-label="`Preview on ${theme}`"
                  class="tile"
                  color="surface-base"
                  rounded="lg"
                  border
                >
                  <img v-if="previewUrl" :src="previewUrl" alt="">
                  <VIcon
                    v-else
                    color="medium-emphasis"
                    icon="mdi-image-outline"
                  />
                </VSheet>
              </VThemeProvider>
            </div>
            <div class="file-meta d-flex flex-column align-start ga-2">
              <div
                :class="{ 'text-medium-emphasis': !file }"
                class="file-name text-body-small text-truncate"
              >
                {{ file?.name ?? 'No image yet' }}
              </div>
              <VBtn
                :aria-describedby="[hintId, messagesId.value].join(' ')"
                :text="file ? 'Replace image' : 'Upload image'"
                variant="tonal"
                @click="fileInput?.click()"
              />
            </div>
          </div>
        </template>
      </VInput>
      <input
        ref="fileInput"
        :accept="IMAGE_TYPES.join(',')"
        aria-label="Image"
        class="d-none"
        type="file"
        @change="onFileInput"
      >
      <VTextField
        v-model.trim="name"
        :error-messages="nameError"
        :rules="[nameFormatRule]"
        hide-details="auto"
        hint="What you type to use it in messages."
        label="Shortcode"
        prefix=":"
        suffix=":"
        validate-on="invalid-input"
        variant="outlined"
        persistent-hint
      />
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="isOpen = false" />
      <VBtn
        :disabled="!isValid"
        :loading="isSaving"
        color="primary"
        text="Add emoji"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import {
  EMOJI_MAX_UPLOAD_BYTES,
  EMOJI_NAME_PATTERN,
  EMOJI_NAME_REQUIREMENTS,
  toEmojiShortcode,
} from '@tailor-cms/utils';
import { formatFileSize, TailorDialog } from '@tailor-cms/core-components';
import { useObjectUrl } from '@vueuse/core';
import { useEmojiStore } from '@/stores/emoji';

const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
];
const SIZE_LIMIT = `${EMOJI_MAX_UPLOAD_BYTES / 1024 ** 2} MB`;
const IMAGE_HINT = `
  PNG, JPEG, WebP, GIF or AVIF, up to ${SIZE_LIMIT}. Square images with \
  transparent backgrounds work best; animation is kept.`;
const THEMES = ['light', 'dark'];

const emojiStore = useEmojiStore();
const notify = useNotification();

const isOpen = defineModel<boolean>({ default: false });
const name = ref('');
const file = ref<File | null>(null);
const isSaving = ref(false);
const serverError = ref<{ field: 'name' | 'file'; message: string }>();

const hintId = useId();
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');

const previewUrl = useObjectUrl(file);

const onFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) file.value = input.files[0];
  // Lets the same file be picked again after a failed upload
  input.value = '';
};

const normalizedName = computed(() => name.value.toLowerCase());
const isNameValid = computed(() =>
  EMOJI_NAME_PATTERN.test(normalizedName.value),
);

const serverErrorFor = (field: 'name' | 'file') =>
  serverError.value?.field === field ? serverError.value.message : '';

const nameFormatRule = () => {
  if (!normalizedName.value || isNameValid.value) return true;
  return EMOJI_NAME_REQUIREMENTS;
};

const nameError = computed(() => {
  if (!isNameValid.value) return '';
  if (emojiStore.get(normalizedName.value)) return 'That shortcode is taken.';
  return serverErrorFor('name');
});

const fileError = computed(() => {
  const size = file.value?.size ?? 0;
  if (size <= EMOJI_MAX_UPLOAD_BYTES) return serverErrorFor('file');
  return `That image is ${formatFileSize(size)}; the limit is ${SIZE_LIMIT}.`;
});

const isValid = computed(
  () =>
    isNameValid.value && !nameError.value && !!file.value && !fileError.value,
);

// Fits a file name to the shortcode rules: `Party Parrot.gif` -> `party_parrot`
const toNameFromFile = (fileName: string) =>
  fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_+-]+/g, '_')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, 30)
    .replace(/_+$/, '');

// A typed name is never overwritten
const suggestName = (value: File | null, previous: File | null) => {
  if (!value) return;
  const previousName = previous ? toNameFromFile(previous.name) : '';
  if (name.value && name.value !== previousName) return;
  const candidate = toNameFromFile(value.name);
  name.value = EMOJI_NAME_PATTERN.test(candidate) ? candidate : '';
};

const reset = () => {
  name.value = '';
  file.value = null;
  serverError.value = undefined;
};

const submit = async () => {
  if (!isValid.value || !file.value) return;
  isSaving.value = true;
  try {
    const emoji = await emojiStore.add(normalizedName.value, file.value);
    notify(`${toEmojiShortcode(emoji.name)} is ready to use`);
    isOpen.value = false;
  } catch (error: any) {
    const { status, data } = error?.response ?? {};
    const message = data?.error?.message ?? 'We could not add that emoji.';
    // A name is only refused as taken; every other refusal is the image
    const field = status === 409 ? 'name' : 'file';
    serverError.value = { field, message };
  } finally {
    isSaving.value = false;
  }
};

watch(isOpen, (value) => {
  if (!value) reset();
});

watch(file, suggestName);

watch([name, file], () => {
  serverError.value = undefined;
});
</script>

<style lang="scss" scoped>
.tile {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;

  img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
  }
}

.file-meta {
  flex: 1 1 8.75rem;
  min-width: 0;
}

.file-name {
  max-width: 100%;
}
</style>
