<template>
  <div class="auth-container fill-height bg-primary-darken-4 pa-4">
    <VSheet
      class="auth-panel d-flex pa-5 bg-primary-darken-3"
      border="surface sm"
      max-width="840"
      rounded="xl"
    >
      <VRow>
        <VCol
          class="d-flex justify-start align-start pt-4 pl-7"
          cols="12"
          lg="6"
          md="12"
        >
          <div class="d-flex align-center justify-center pt-4">
            <img :src="logoPath" alt="Logo" class="logo" width="78" />
            <h1 class="app-title ml-4 text-primary-lighten-5">{{ title }}</h1>
          </div>
        </VCol>
        <VCol class="auth-body py-8" cols="12" lg="6" md="12">
          <slot></slot>
        </VCol>
      </VRow>
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
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
    font-family: Poppins, Roboto, sans-serif;
    font-size: 1.75rem;
  }

  // Override autofill styles
  input:-webkit-autofill {
    color: #fafafa !important;
    background-color: #263238 !important;
    -webkit-text-fill-color: #fafafa !important;
    -webkit-box-shadow: 0 0 0 1000px #263238 inset !important;
  }

  // Override vuetify error styles for auth forms
  .v-input--error:not(.v-input--disabled) {
    .v-input__details .v-messages,
    .v-field__prepend-inner > .v-icon,
    .v-field__outline,
    .v-label.v-field-label {
      color: #f8bbd0;
    }
  }
}

.auth-container .auth-panel.v-sheet {
  position: absolute;
  width: 100%;
  z-index: 1;

  .auth-body {
    padding: 0.25rem 1.5rem 2rem;

    a {
      color: inherit;
      font-weight: 400;
    }
  }
}

.auth-container .waves-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 15rem;
}
</style>
