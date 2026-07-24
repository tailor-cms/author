<template>
  <div id="app">
    <AppBar v-if="store.user" :user="store.user" />
    <VMain>
      <slot></slot>
    </VMain>
    <ConfirmationDialog />
    <div class="indicator-stack">
      <IndexingIndicator />
      <UploadIndicator />
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppBar from '@/components/common/AppBar.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import IndexingIndicator from '@/components/repository/Assets/IndexingIndicator.vue';
import UploadIndicator from '@/components/repository/Assets/UploadIndicator.vue';
import { useAuthStore } from '@/stores/auth';

const store = useAuthStore();
</script>

<style lang="scss">
#app {
  height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
}

// Stacks the background-progress indicators (indexing
// above uploads) so they never overlap.
.indicator-stack {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
  z-index: 2000;
}

.v-main {
  height: 100%;
  transition: none;
}

.v-main__scroller {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
