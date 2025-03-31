<template>
  <NuxtLayout name="main">
    <VContainer class="h-100 pt-14" max-width="1400">
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
      </VSheet>p
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
