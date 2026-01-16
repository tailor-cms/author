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
          <VAvatar
            id="avatar"
            color="primary-lighten-5"
            v-bind="hoverProps"
            size="180"
          >
            <img v-if="imgUrl" :src="imgUrl" alt="Avatar" />
            <VIcon
              v-else
              :icon="placeholderIcon"
              class="placeholder"
              color="primary-lighten-2"
            />
            <VFadeTransition>
              <VIcon
                v-if="isHovering"
                v-bind="(imgUrl && !isGravatar) ? activatorProps : {}"
                aria-label="Change avatar"
                class="overlay"
                color="white"
                icon="mdi-camera"
                size="x-large"
                @click="!(imgUrl && !isGravatar) && triggerUpload()"
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
      </VBtn>
      <VBtn
        v-if="!isGravatar"
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

const fileInput = ref<HTMLInputElement | null>(null);

const isGravatar = computed(() => /gravatar.com/.test(props.imgUrl));

const triggerUpload = () => fileInput.value?.click();

const selectPhoto = (event: Event) => {
  const { files } = event.target as HTMLInputElement;
  if (!files?.[0]) return;
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
$image-border: 4px solid white;
$image-bg-color: rgb(var(--v-theme-primary-lighten-4));

.v-avatar {
  img,
  .v-icon {
    border: $image-border;
    border-radius: 50%;
    background-color: $image-bg-color;
    height: 100%;
    width: 100%;

    &.placeholder {
      font-size: 6rem;
    }
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.7;
    background: #607d8b;
    cursor: pointer;
  }
}

.placeholder-icon {
  background-color: #cfd8dc !important;
}
</style>
