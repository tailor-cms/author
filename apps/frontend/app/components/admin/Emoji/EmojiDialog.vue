<template>
  <TailorDialog
    v-model="isOpen"
    header-icon="mdi-emoticon-plus-outline"
    title="Add a custom emoji"
    persistent
    @submit="submit"
  >
    <template #body>
      <VTextField
        v-model.trim="name"
        :error-messages="nameError"
        class="mb-4"
        hide-details="auto"
        label="Shortcode"
        prefix=":"
        suffix=":"
        variant="outlined"
      />
      <VFileInput
        v-model="file"
        :error-messages="fileError"
        :accept="IMAGE_TYPES"
        hide-details="auto"
        label="Image"
        prepend-icon=""
        prepend-inner-icon="mdi-image-outline"
        variant="outlined"
        show-size
      />
      <VCard
        class="d-flex align-center ga-4 my-4 pa-3"
        color="surface-sunken"
        rounded="lg"
        flat
      >
        <VSheet class="tile" color="surface-raised" rounded="lg">
          <img v-if="previewUrl" :src="previewUrl">
          <VIcon
            v-else
            color="medium-emphasis"
            icon="mdi-image-outline"
            size="28"
          />
        </VSheet>
        <div class="overflow-hidden">
          <div class="text-label-small text-medium-emphasis mb-1">
            {{ isNameValid ? toEmojiShortcode(normalizedName) : 'Preview' }}
          </div>
          <div v-if="previewUrl" class="text-body-medium text-truncate">
            Nice work <img :src="previewUrl" class="inline">
          </div>
          <div v-else class="text-body-small text-medium-emphasis">
            {{ IMAGE_HINT }}
          </div>
        </div>
      </VCard>
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
import { EMOJI_NAME, EMOJI_NAME_RULE, toEmojiShortcode } from '@tailor-cms/utils';
import { TailorDialog } from '@tailor-cms/core-components';
import { useObjectUrl } from '@vueuse/core';
import { useEmojiStore } from '@/stores/emoji';

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif,image/avif';
const IMAGE_HINT = `
  PNG, JPEG, WebP, GIF or AVIF, up to 2 MB. Square \
  images read best; animation is kept.`;

const emojiStore = useEmojiStore();
const notify = useNotification();

const isOpen = defineModel<boolean>({ default: false });
const name = ref('');
const file = ref<File | null>(null);
const isSaving = ref(false);
const serverError = ref<{ field: 'name' | 'file'; message: string }>();

const previewUrl = useObjectUrl(file);
const normalizedName = computed(() => name.value.toLowerCase());
const isNameValid = computed(() => EMOJI_NAME.test(normalizedName.value));

const serverErrorFor = (field: 'name' | 'file') =>
  serverError.value?.field === field ? serverError.value.message : '';

const nameError = computed(() => {
  if (!normalizedName.value) return '';
  if (!isNameValid.value) return EMOJI_NAME_RULE;
  if (emojiStore.get(normalizedName.value)) return 'That shortcode is taken.';
  return serverErrorFor('name');
});

const fileError = computed(() => serverErrorFor('file'));

const isValid = computed(
  () => isNameValid.value && !nameError.value && !!file.value,
);

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

watch([name, file], () => {
  serverError.value = undefined;
});
</script>

<style lang="scss" scoped>
.tile {
  display: grid;
  flex: none;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;

  img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
  }
}

.inline {
  width: 1.375em;
  height: 1.375em;
  vertical-align: -0.3em;
  object-fit: contain;
}
</style>
