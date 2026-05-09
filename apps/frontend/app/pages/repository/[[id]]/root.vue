<template>
  <div class="repo-container">
    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  middleware: ['auth'],
});

const store = useCurrentRepository();

useHead({
  title: store.repository?.name,
  meta: [{ name: 'description', content: 'Tailor CMS - Repository page' }],
});
</script>

<style lang="scss" scoped>
.repo-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
