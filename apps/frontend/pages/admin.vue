<template>
  <NuxtLayout name="main">
    <VContainer class="h-100 pt-14">
      <VSheet color="primary-lighten-4" rounded="lg">
        <VRow>
          <VCol cols="3">
            <AdminSidebar class="ml-3 my-2" />
          </VCol>
          <VCol class="pl-3 pb-7" cols="9">
            <VSheet
              class="my-2 mr-5 h-100"
              color="primary-lighten-5"
              rounded="lg"
            >
              <NuxtPage />
            </VSheet>
          </VCol>
        </VRow>
      </VSheet>
    </VContainer>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  name: 'admin',
  middleware: ['auth'],
});

const authStore = useAuthStore();

onBeforeMount(async () => {
  // Refetch user info to get the latest permissions
  await authStore.fetchUserInfo();
  if (authStore.isAdmin) return;
  navigateTo({ name: 'catalog' });
});
</script>
