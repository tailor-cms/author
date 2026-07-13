<template>
  <div id="app">
    <AppBar v-if="store.user" :user="store.user" />
    <VMain>
      <slot></slot>
    </VMain>
    <ConfirmationDialog />
    <UploadIndicator />
  </div>
</template>

<script lang="ts" setup>
import AppBar from '@/components/common/AppBar.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import UploadIndicator from '@/components/common/UploadIndicator.vue';
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
