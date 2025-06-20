<template>
  <div id="app">
    <AppBar v-if="store.user" :user="store.user" />
    <VMain class="view">
      <slot></slot>
    </VMain>
    <ConfirmationDialog />
    <NotificationSnackbar />
  </div>
</template>

<script lang="ts" setup>
import AppBar from '@/components/common/AppBar.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import NotificationSnackbar from '@/components/common/NotificationSnackbar.vue';
import { useAuthStore } from '@/stores/auth';

const store = useAuthStore();
</script>

<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
}

html {
  overflow-y: auto !important; // override Vuetify's default style
}

#app {
  --text-color-default: rgba(0, 0, 0, 0.87);
  height: 100vh;
  color: var(--text-color-default);
  // font-family: $font-family-primary;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
}

.application,
.v-application--wrap,
.v-main,
.view {
  width: 100%;
  height: 100%;
  overflow-y: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.v-main {
  background: #37474f;
}

.v-main .view {
  overflow-y: scroll;
  overflow-y: overlay;
}

.text--default {
  color: var(--text-color-default);
}
</style>
