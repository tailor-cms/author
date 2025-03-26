<template>
  <VAvatar :size="size" tile>
    <VImg v-if="logoUrl" :src="logoUrl" alt="User group avatar" />
    <VIcon v-else :color="placeholderColor" icon="mdi-account-multiple-outline" />
  </VAvatar>
</template>

<script lang="ts" setup>
interface Props {
  placeholderColor?: string;
  logoUrl?: string;
  size?: number;
}

withDefaults(defineProps<Props>(), {
  size: 24,
  placeholderColor: 'primary-lighten-4',
});
</script>
