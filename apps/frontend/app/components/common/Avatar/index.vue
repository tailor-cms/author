<template>
  <div>
    <VSpeedDial content-class="flex-column" location="right" target="#avatar">
      <template #activator="{ props: activatorProps }">
        <VAvatar id="avatar" size="180" color="surface-container-low" border="lg">
          <img v-if="imgUrl" :src="imgUrl" alt="Avatar" class="h-100 w-100" />
          <VIcon
            v-else
            :icon="placeholderIcon"
            color="surface-container-highest"
            class="placeholder"
            size="96"
          />
          <VSheet
            v-bind="(imgUrl && !isGravatar) ? activatorProps : {}"
            aria-label="Change avatar"
            class="change-avatar h-100 w-100"
            role="button"
            @click="!(imgUrl && !isGravatar) && triggerUpload()"
          >
            <VIcon icon="mdi-camera" size="48" />
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
