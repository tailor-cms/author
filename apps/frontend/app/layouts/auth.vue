<template>
  <div class="auth-container fill-height bg-surface pa-4">
    <VSheet
      class="auth-panel d-flex"
      color="surface-container-low"
      max-width="840"
      rounded="xl"
      border
    >
      <div class="theme-switcher">
        <ThemeSwitcher />
      </div>
      <VRow no-gutters>
        <VCol
          class="d-flex justify-start align-start pa-8"
          cols="12"
          lg="5"
        >
          <div class="d-flex align-center justify-center">
            <img :src="logoPath" alt="Logo" class="logo" width="64" />
            <h1 class="app-title ml-4">{{ title }}</h1>
          </div>
        </VCol>
        <VCol class="auth-body pa-8 pa-sm-12" cols="12" lg="7">
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
  display: flex;
  justify-content: center;
  align-items: center;

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

  .theme-switcher {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    z-index: 1;
    opacity: 0.7;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  .auth-body {
    a {
      color: inherit;
      font-weight: 400;
    }
  }
}
</style>
