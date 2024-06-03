<template>
  <VSpeedDial location="right" target="#avatar" attach>
    <template #activator="{ props: activatorProps }">
      <VHover #default="{ isHovering, props }">
        <VAvatar id="avatar" v-bind="props" size="200">
          <VImg :src="image" />
          <VIcon
            v-if="isHovering"
            v-bind="activatorProps"
            class="overlay"
            icon="mdi-camera"
            size="x-large"
            color="white"
          />
        </VAvatar>
      </VHover>
    </template>
    <VBtn
      key="1"
      for="photoInput"
      small
      icon
      tag="label"
    >
      <VIcon>mdi-upload</VIcon>
      <input
        id="photoInput"
        ref="fileInput"
        accept="image/*"
        name="photo"
        type="file"
        @change="selectPhoto"
        hidden
      />
    </VBtn>
    <VBtn
      v-if="!isGravatar"
      key="2"
      @click="deleteAvatar"
      color="secondary-lighten-1"
      small
      icon="mdi-delete"
    />
  </VSpeedDial>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useAuthStore } from '@/stores/auth';
import Compressor from 'compressorjs';
// import AvatarDialog from '@/components/user/Avatar/AvatarDialog.vue';

const store = useAuthStore();
const notify = useNotification();

const image = computed(() => (store.user as any).imgUrl);
const isGravatar = computed(() => /gravatar.com/.test(image.value));
const isHovered = ref(false);
const fileInput = ref();

const selectAvatar = () => fileInput.value.$refs.fileInput.click();

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

const navigate = (path: string) => {
  navigateTo(path);
};

const selectPhoto = (event) => {
  const file = event.target?.files[0];
  new Compressor(file, {
    width: 250,
    height: 250,
    success: async (result) => {
      const imageUrl = await toBase64(result);
      updateAvatar(imageUrl);
    },
    error: (err) => console.log(err.message),
  });
}

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});
</script>

<style lang="scss" scoped>
$image-border: 4px solid #e3e3e3;
$image-bg-color: #f5f5f5;
$image-width: 12.5rem;
$image-height: 12.5rem;

.v-avatar ::v-deep {
  img, .v-icon {
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
