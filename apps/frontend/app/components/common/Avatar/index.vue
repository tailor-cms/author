<template>
  <div>
    <VSpeedDial content-class="flex-column" location="right" target="#avatar">
      <template #activator="{ props: activatorProps }">
        <VAvatar id="avatar" :size="size" color="surface-container-low" border="lg">
          <img v-if="imgUrl" :src="imgUrl" alt="Avatar" class="h-100 w-100" />
          <VIcon
            v-else
            :icon="placeholderIcon"
            :size="placeholderIconSize"
            color="surface-container-highest"
            class="placeholder"
          />
          <VSheet
            v-bind="(imgUrl && !isGravatar) ? activatorProps : {}"
            aria-label="Change avatar"
            class="change-avatar h-100 w-100"
            role="button"
            @click="!(imgUrl && !isGravatar) && triggerUpload()"
          >
            <VIcon icon="mdi-camera" :size="cameraIconSize" />
          </VSheet>
        </VAvatar>
      </template>
      <VBtn
        key="1"
        aria-label="Upload avatar"
        icon="mdi-upload"
        for="photoInput"
        tag="label"
        variant="tonal"
      />
      <VBtn
        v-if="!isGravatar"
        key="2"
        aria-label="Delete avatar"
        color="error"
        icon="mdi-trash-can-outline"
        variant="tonal"
        @click="$emit('delete')"
      />
    </VSpeedDial>
    <input
      id="photoInput"
      :key="imgUrl"
      ref="fileInput"
      :accept="acceptedExtensions"
      name="photo"
      type="file"
      hidden
      @change="selectPhoto"
    />
  </div>
</template>

<script lang="ts" setup>
import { IMAGE_INPUT_EXT } from '@tailor-cms/config';

import { resizeAvatarImage } from './resize-image';

export interface Props {
  imgUrl?: string;
  placeholderIcon?: string;
  size?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  imgUrl: '',
  placeholderIcon: 'mdi-account-multiple',
  size: 180,
});

// Keep the placeholder & camera icons proportional to the avatar circle.
const placeholderIconSize = computed(() => Math.round(Number(props.size) * 0.53));
const cameraIconSize = computed(() => Math.round(Number(props.size) * 0.27));

const emit = defineEmits(['save', 'delete']);

const notify = useNotification();

const fileInput = ref<HTMLInputElement | null>(null);

const isGravatar = computed(() => /gravatar.com/.test(props.imgUrl));

const triggerUpload = () => fileInput.value?.click();

const AVATAR_SIZE = 250;
// A resized/compressed AVATAR_SIZE x AVATAR_SIZE JPEG data URL should land under
const MAX_IMAGE_LENGTH = 300_000;

const acceptedExtensions = IMAGE_INPUT_EXT.map((ext) => `.${ext}`).join(',');

const isSupportedImage = (file: File) => {
  const name = file.name.toLowerCase();
  return IMAGE_INPUT_EXT.some((ext) => name.endsWith(`.${ext}`));
};

const selectPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!isSupportedImage(file)) {
    notify('That image format isn\'t supported. Please choose a different image.', {
      immediate: true,
      color: 'error',
    });
    return;
  }
  try {
    const imageUrl = await resizeAvatarImage(file, AVATAR_SIZE);
    if (imageUrl.length > MAX_IMAGE_LENGTH) {
      notify('Unable to compress that image enough, please try a different one.', {
        immediate: true,
        color: 'error',
      });
      return;
    }
    emit('save', imageUrl);
  } catch (err: any) {
    notify(err.message, { immediate: true, color: 'error' });
  }
};
</script>

<style lang="scss" scoped>
.change-avatar {
  position: absolute;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  transition: opacity 0.2s ease;

  &:hover,
  &:focus-visible {
    opacity: 0.7;
  }
}
</style>
