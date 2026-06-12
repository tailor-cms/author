<template>
  <NuxtLayout name="main">
    <div class="admin-page overflow-auto h-100">
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
    </div>
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
