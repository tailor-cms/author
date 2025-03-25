<template>
  <div>
    <!-- TODO: Replace content-props with content-class once it gets fixed -->
    <VSpeedDial
      :content-props="{ class: 'flex-column ga-3' }"
      location="right"
      offset="16"
      target="#avatar"
    >
      <template #activator="{ props: activatorProps }">
        <VHover v-slot="{ isHovering, props: hoverProps }">
          <VAvatar id="avatar" v-bind="hoverProps" :size="180">
            <VFadeTransition class="d-flex align-center justify-space-around">
              <VIcon
                v-if="imgUrl && isHovering"
                v-bind="activatorProps"
                aria-label="Change avatar"
                class="overlay"
                color="white"
                icon="mdi-camera"
                size="x-large"
              />
              <div v-else>
                <img v-if="imgUrl" :src="imgUrl" alt="Avatar" width="180" />
                <VIcon
                  v-else
                  :icon="placeholderIcon"
                  class="placeholder-icon"
                  @click="openAvatarUploadDialog"
                />
              </div>
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
        @click="openAvatarUploadDialog"
      >
        <VIcon>mdi-upload</VIcon>
      </VBtn>
      <VBtn
        v-if="!isGravatar && imgUrl"
        key="2"
        aria-label="Delete avatar"
        color="secondary-lighten-2"
        icon="mdi-delete"
        variant="tonal"
        small
        @click="$emit('delete')"
      />
    </VSpeedDial>
    <input
      id="photoInput"
      :key="imgUrl"
      ref="fileInput"
      accept="image/*"
      name="photo"
      type="file"
      hidden
      @change="selectPhoto"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import Compressor from 'compressorjs';

export interface Props {
  imgUrl?: string;
  placeholderIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  imgUrl: '',
  placeholderIcon: 'mdi-account-multiple',
});

const emit = defineEmits(['save', 'delete']);

const notify = useNotification();

const fileInput = ref();
const isGravatar = computed(() => /gravatar.com/.test(props.imgUrl));

const openAvatarUploadDialog = () => {
  fileInput.value.click();
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
      emit('save', imageUrl);
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
$image-border: 4px solid #cfd8dc;
$image-bg-color: #cfd8dc;
$image-width: 11.25rem;
$image-height: 11.25rem;

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

.placeholder-icon {
  padding: $image-height;
  background-color: #cfd8dc !important;
}
</style>
