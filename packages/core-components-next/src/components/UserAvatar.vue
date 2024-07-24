<template>
  <VTooltip :disabled="!label" location="bottom" open-delay="500">
    <template #activator="{ props: tooltipProps }">
      <VAvatar
        v-bind="{ ...tooltipProps, ...$attrs }"
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
        <VIcon v-else color="primary-darken-3">mdi-account</VIcon>
      </VAvatar>
    </template>
    {{ label }}
  </VTooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  imgUrl?: string;
  size?: number | string;
  color?: string;
  rounded?: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  imgUrl: '',
  label: '',
  size: 36,
  color: 'teal-lighten-3',
  rounded: 'xl',
});

const style = computed(() =>
  props.imgUrl ? { 'background-image': `url(${props.imgUrl})` } : {},
);
</script>

<style lang="scss" scoped>
.user-avatar-container {
  padding: 0.125rem;
  overflow: hidden !important;

  .user-avatar {
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 50%;
  }
}
</style>
