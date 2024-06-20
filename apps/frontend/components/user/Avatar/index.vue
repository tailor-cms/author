<template>
  <!-- TODO: Replace content-props with content-class once it gets fixed -->
  <VSpeedDial
    :content-props="{ class: 'flex-column ga-3' }"
    location="right"
    offset="16"
    target="#avatar"
  >
    <template #activator="{ props: activatorProps }">
      <VHover v-slot="{ isHovering, props }">
        <VAvatar id="avatar" v-bind="props" size="200">
          <img :src="image" alt="Avatar" />
          <VFadeTransition>
            <VIcon
              v-if="isHovering"
              v-bind="activatorProps"
              aria-label="Change avatar"
              class="overlay"
              color="white"
              icon="mdi-camera"
              size="x-large"
            />
          </VFadeTransition>
        </VAvatar>
      </VHover>
    </template>
    <VBtn
      key="1"
      aria-label="Upload avatar"
      color="primary-darken-4"
      for="photoInput"
      tag="label"
      variant="tonal"
      icon
      small
    >
      <VIcon>mdi-upload</VIcon>
      <input
        id="photoInput"
        ref="fileInput"
        accept="image/*"
        name="photo"
        type="file"
        hidden
        @change="selectPhoto"
      />
    </VBtn>
    <VBtn
      v-if="!isGravatar"
      key="2"
      aria-label="Delete avatar"
      color="secondary-lighten-2"
      icon="mdi-delete"
      variant="tonal"
      small
      @click="deleteAvatar"
    />
  </VSpeedDial>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import Compressor from 'compressorjs';

import { useAuthStore } from '@/stores/auth';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';

const fileInput = ref();

const store = useAuthStore();
const notify = useNotification();

const image = computed(() => (store.user as any).imgUrl);
const isGravatar = computed(() => /gravatar.com/.test(image.value));

const updateAvatar = (imgUrl?: string) => {
  return store.updateInfo({ imgUrl }).then(() => {
    notify('Your profile picture has been updated!', { immediate: true });
  });
};

const deleteAvatar = () => {
  const showConfirmationDialog = useConfirmationDialog();
  showConfirmationDialog({
    title: 'Delete avatar?',
    message: 'Are you sure you want to delete your profile picture?',
    action: () => updateAvatar(''),
  });
};

const selectPhoto = (event: Event) => {
  const { files } = event.target as HTMLInputElement;
  if (!files?.length) return;
  return new Compressor(files[0], {
    width: 250,
    height: 250,
    resize: 'cover',
    success: async (result) => {
      const imageUrl = await toBase64(result);
      updateAvatar(imageUrl);
    },
    error: (err) => notify(err.message, { immediate: true, color: 'error' }),
  });
};

const toBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
</script>

<style lang="scss" scoped>
$image-border: 4px solid #e3e3e3;
$image-bg-color: #f5f5f5;
$image-width: 12.5rem;
$image-height: 12.5rem;

.v-avatar {
  img,
  .v-icon {
    border: $image-border;
    border-radius: 50%;
    background-color: $image-bg-color;
    height: 100%;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.7;
    width: $image-width;
    background: #607d8b;
    cursor: pointer;
  }
}
</style>
