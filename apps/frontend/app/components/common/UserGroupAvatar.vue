<template>
  <VAvatar :size="size" color="surface-container-highest">
    <VImg v-if="logoUrl" :src="logoUrl" alt="User group avatar" />
    <VIcon v-else :icon="placeholderIcon" :size="Number(size) * 0.6" />
  </VAvatar>
</template>

<script lang="ts" setup>
interface Props {
  placeholderColor?: string;
  placeholderIcon?: string;
  logoUrl?: string;
  size?: number | string;
}

withDefaults(defineProps<Props>(), {
  size: 24,
  placeholderIcon: 'mdi-account-multiple',
});
</script>
