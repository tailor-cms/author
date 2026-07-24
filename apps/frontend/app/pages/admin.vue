<template>
  <NuxtLayout name="main">
    <VSheet
      color="surface-canvas"
      rounded="t-xl"
      border
      class="admin-page mx-3 h-100 overflow-auto"
    >
      <VContainer class="px-md-10 py-md-8 text-left" max-width="1400">
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

<style lang="scss" scoped>
.admin-page {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
