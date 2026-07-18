<template>
  <NuxtLayout name="main">
    <VLayout
      class="h-100 mx-3 bg-surface-canvas rounded-t-xl border-sm overflow-hidden"
    >
      <VNavigationDrawer
        v-model="showSidebar"
        color="surface-canvas"
        elevation="0"
        location="left"
        mobile-breakpoint="md"
        order="1"
        width="380"
      >
        <div class="d-flex align-center justify-space-between px-4 pt-4 mb-1">
          <div class="text-title-medium font-weight-bold ml-1">
            Administration
          </div>
          <VBtn
            v-tooltip:bottom="{ text: 'Collapse sidebar', openDelay: 500 }"
            aria-label="Collapse sidebar"
            density="comfortable"
            icon="mdi-chevron-double-left"
            size="small"
            variant="tonal"
            @click="showSidebar = false"
          />
        </div>
        <AdminSidebar />
      </VNavigationDrawer>
      <VMain class="admin-main">
        <VFadeTransition>
          <VBtn
            v-if="!showSidebar"
            v-tooltip:right="{ text: 'Open sidebar', openDelay: 500 }"
            aria-label="Open sidebar"
            class="sidebar-toggle"
            color="secondary-container"
            density="comfortable"
            icon="mdi-chevron-double-right"
            size="small"
            @click="showSidebar = true"
          />
        </VFadeTransition>
        <VContainer class="px-md-10 py-md-8 text-left" max-width="1400">
          <NuxtPage />
        </VContainer>
      </VMain>
    </VLayout>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue';

definePageMeta({
  name: 'admin',
  middleware: ['auth', 'has-admin-access'],
});

const showSidebar = ref(true);
</script>

<style lang="scss" scoped>
.admin-main {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.sidebar-toggle {
  position: absolute;
  width: 1.5rem;
  height: 3.5rem;
  top: 4rem;
  left: 0;
  transform: translateY(-50%);
  z-index: 1004;
  border-radius: 0 8px 8px 0;
}
</style>
