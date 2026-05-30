<template>
  <NuxtLayout name="main">
    <VSheet
      class="h-100 mx-3 overflow-auto"
      color="surface-container-low"
      rounded="t-xl"
      border
    >
      <VContainer class="pt-14" max-width="1400">
        <VRow>
          <VCol cols="12" md="3">
            <AdminSidebar />
          </VCol>
          <VCol cols="12" md="9">
            <NuxtPage />
          </VCol>
        </VRow>
      </VContainer>
    </VSheet>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue';

definePageMeta({
  name: 'admin',
  middleware: ['auth', 'has-admin-access'],
});
</script>
