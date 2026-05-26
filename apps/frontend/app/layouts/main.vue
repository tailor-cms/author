<template>
  <div id="app">
    <AppBar v-if="store.user" :user="store.user" />
    <VMain class="view bg-primary-darken-4">
      <slot></slot>
    </VMain>
    <AgentPanel v-if="store.user" />
    <ConfirmationDialog />
    <NotificationSnackbar />
  </div>
</template>

<script lang="ts" setup>
import AgentPanel from '@/components/common/AgentPanel/index.vue';
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

#app {
  --text-color-default: rgba(0, 0, 0, 0.87);
  height: 100vh;
  color: var(--text-color-default);
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

.v-main .view {
  overflow-y: scroll;
  overflow-y: overlay;
}

.text--default {
  color: var(--text-color-default);
}
</style>
