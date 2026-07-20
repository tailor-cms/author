<template>
  <div>
    <div
      :class="{ 'is-revealed': isRevealed }"
      class="avatar d-inline-flex"
      @click="isRevealed = !isRevealed"
    >
      <VAvatar :size="size" color="surface-container-high" border="lg">
        <img v-if="imgUrl" :src="imgUrl" alt="Avatar" class="h-100 w-100" />
        <VIcon
          v-else
          :icon="placeholderIcon"
          :size="placeholderIconSize"
          color="surface-raised"
          class="placeholder"
        />
      </VAvatar>
      <div class="avatar-actions d-flex align-center justify-center ga-1">
        <VIconBtn
          :aria-label="uploadLabel"
          color="inverse-surface"
          icon="mdi-upload"
          variant="tonal"
          @click.stop="triggerUpload"
        />
        <VIconBtn
          v-if="canDelete"
          aria-label="Delete avatar"
          color="error"
          icon="mdi-trash-can-outline"
          variant="tonal"
          @click.stop="$emit('delete')"
        />
      </div>
    </div>
    <input
      :key="imgUrl"
      ref="fileInput"
      :accept="acceptedExtensions"
      name="photo"
      type="file"
      hidden
      @change="selectPhoto"
    />
    <TailorDialog
      v-model="isCropOpen"
      header-icon="mdi-crop"
      title="Adjust avatar"
      width="460"
      @after-leave="cleanup"
    >
      <template #body>
        <ImageCropper
          v-if="cropSrc"
          ref="cropper"
          :output-size="AVATAR_SIZE"
          :src="cropSrc"
        />
      </template>
      <template #actions>
        <VSpacer />
        <VBtn text="Cancel" variant="text" @click="isCropOpen = false" />
        <VBtn
          color="primary"
          prepend-icon="mdi-check"
          text="Apply"
          variant="flat"
          @click="applyCrop"
        />
      </template>
    </TailorDialog>
  </div>
</template>

<script lang="ts" setup>
import { IMAGE_INPUT_EXT } from '@tailor-cms/config';
import { TailorDialog } from '@tailor-cms/core-components';

import ImageCropper from './ImageCropper.vue';
import { prepareCropSource } from './prepare-source';

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

// Keep the placeholder icon proportional to the avatar circle.
const placeholderIconSize = computed(() => Math.round(Number(props.size) * 0.53));

const emit = defineEmits(['save', 'delete']);

const notify = useNotification();

const fileInput = ref<HTMLInputElement | null>(null);
const cropper = ref<InstanceType<typeof ImageCropper> | null>(null);
const isCropOpen = ref(false);
const cropSrc = ref('');
// Touch has no hover, so a tap toggles the actions (see the styles).
const isRevealed = ref(false);

const isGravatar = computed(() => /gravatar.com/.test(props.imgUrl));
// Gravatars and the placeholder have nothing local to remove.
const canDelete = computed(() => Boolean(props.imgUrl) && !isGravatar.value);
const uploadLabel = computed(() =>
  canDelete.value ? 'Change avatar' : 'Upload avatar',
);

const triggerUpload = () => fileInput.value?.click();

const AVATAR_SIZE = 250;
// Cap the cropper source so large photos stay responsive to pan/zoom.
const CROP_SOURCE_SIZE = 1200;

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
    cropSrc.value = await prepareCropSource(file, CROP_SOURCE_SIZE);
    isCropOpen.value = true;
  } catch (err: any) {
    notify(err.message, { immediate: true, color: 'error' });
  }
};

const applyCrop = async () => {
  const imageUrl = await cropper.value?.getResult();
  isCropOpen.value = false;
  if (imageUrl) emit('save', imageUrl);
};

const cleanup = () => {
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value);
  cropSrc.value = '';
};
</script>

<style lang="scss" scoped>
.avatar {
  position: relative;
  border-radius: 50%;
  overflow: hidden;

  img {
    clip-path: circle(50%);
    transition:
      filter 0.3s ease,
      transform 0.3s ease;
  }
}

.avatar-actions {
  position: absolute;
  inset: 0;
  background: rgba(var(--v-theme-surface-container-lowest), 0.6);
  opacity: 0;
  transition: opacity 0.2s ease;
}

@mixin reveal {
  img {
    filter: blur(5px);
    transform: scale(1.05);
  }

  .avatar-actions {
    opacity: 1;
  }
}

// Desktop reveals on hover/focus; the tap-toggle is a no-op here.
@media (hover: hover) {
  .avatar:hover,
  .avatar:focus-within {
    @include reveal;
  }
}

// Touch has no hover, so the photo shows by default and a tap reveals the
// actions via the is-revealed class (see the template click handler).
@media (hover: none) {
  .avatar.is-revealed {
    @include reveal;
  }
}
</style>
