<template>
  <VAvatar
    :color="color"
    :rounded="rounded"
    :size="size"
    class="user-avatar-container"
  >
    <!--
      Background image is used instead of img tag to avoid issues
      with browser blocking the image load.
    -->
    <div v-if="imgUrl" :style="style" class="user-avatar h-100 w-100"></div>
    <VIcon v-else>mdi-account</VIcon>
  </VAvatar>
</template>

<script lang="ts" setup>
import { defineProps, withDefaults } from 'vue';

interface Props {
  imgUrl?: string;
  size?: number;
  color?: string;
  rounded?: string;
}

const props = withDefaults(defineProps<Props>(), {
  imgUrl: '',
  size: 36,
  color: 'teal-lighten-3',
  rounded: 'xl',
});

const style = props.imgUrl
  ? { 'background-image': `url(${props.imgUrl})` }
  : {};
</script>

<style lang="scss" scoped>
.user-avatar-container {
  padding: 0.25rem;
  overflow: hidden !important;

  .user-avatar {
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
}
</style>
