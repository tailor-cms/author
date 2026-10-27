<template>
  <NuxtLayout name="main">
    <!-- Group admins only reach User Groups, a rail of one is noise -->
    <AdminRail v-if="authStore.isAdmin" />
    <VSheet
      :class="[
        hasOwnLayout ? 'overflow-hidden' : 'overflow-auto',
        { 'ml-3': !authStore.isAdmin },
      ]"
      class="admin-page mr-3 h-100"
      color="surface-canvas"
      rounded="t-xl"
      border
    >
      <NuxtPage v-if="hasOwnLayout" />
      <VContainer
        v-else
        class="px-md-10 py-md-8 text-left"
        max-width="1360"
      >
        <NuxtPage />
      </VContainer>
    </VSheet>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import AdminRail from '@/components/admin/AdminRail.vue';
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  name: 'admin',
  middleware: ['auth', 'has-admin-access'],
});

const route = useRoute();
const authStore = useAuthStore();

// Pages laying out their own panes (e.g. a list sidebar) skip the container
const hasOwnLayout = computed(() => !!route.meta.hasOwnLayout);
</script>

<style lang="scss" scoped>
.admin-page {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
