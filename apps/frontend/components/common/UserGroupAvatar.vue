<template>
  <VAvatar :size="size" tile>
    <VImg v-if="logoUrl" :src="logoUrl" alt="User group avatar" />
    <VIcon v-else :color="placeholderColor" :icon="placeholderIcon" />
  </VAvatar>
</template>

<script lang="ts" setup>
interface Props {
  placeholderColor?: string;
  placeholderIcon?: string;
  logoUrl?: string;
  size?: number;
}

withDefaults(defineProps<Props>(), {
  size: 24,
  placeholderColor: 'primary-lighten-4',
  placeholderIcon: 'mdi-account-multiple-outline',
});
</script>
