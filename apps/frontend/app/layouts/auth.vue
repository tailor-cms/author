<template>
  <div class="auth-container fill-height bg-surface-canvas pa-4">
    <div class="theme-switcher">
      <ThemeSwitcher />
    </div>
    <VSheet
      class="auth-panel d-flex pa-8"
      color="surface-raised"
      max-width="840"
      rounded="xl"
      elevation="2"
    >
      <VRow>
        <VCol
          class="d-flex justify-start align-start"
          cols="12"
          lg="5"
        >
          <div class="d-flex align-center justify-center">
            <img :src="logoPath" alt="Logo" class="logo" width="64" />
            <h1 class="app-title ml-4">{{ title }}</h1>
          </div>
        </VCol>
        <VCol class="auth-body pa-" cols="12" lg="7">
          <slot></slot>
        </VCol>
      </VRow>
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';

const props = defineProps<{
  title: string;
}>();

const title = props.title || 'Tailor CMS';
const logoPath = '/img/logo-new.svg';
</script>

<style lang="scss">
.auth-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  .theme-switcher {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 1;
    opacity: 0.7;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  .app-title {
    font-size: 1.875rem;
    line-height: 1.1;
  }

  // Override autofill styles
  input:-webkit-autofill {
    color: rgb(var(--v-theme-on-surface)) !important;
    background-color: rgba(var(--v-theme-surface-container-low)) !important;
    -webkit-text-fill-color: rgb(var(--v-theme-on-surface)) !important;
    -webkit-box-shadow:
      0 0 0 1000px rgba(var(--v-theme-surface-container-low)) inset !important;
  }
}

.auth-container .auth-panel {
  position: relative;
  width: 100%;

  .auth-body {
    a {
      color: inherit;
      font-weight: 400;
    }
  }
}
</style>
