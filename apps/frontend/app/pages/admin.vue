<template>
  <NuxtLayout name="main">
    <VContainer class="h-100 pt-14" max-width="1400">
      <VSheet class="pa-5" color="primary-lighten-4" rounded="lg">
        <VRow>
          <VCol cols="12" md="3">
            <AdminSidebar />
          </VCol>
          <VCol cols="12" md="9">
            <VSheet
              class="h-100"
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

definePageMeta({
  name: 'admin',
  middleware: ['auth', 'has-admin-access'],
});
</script>
