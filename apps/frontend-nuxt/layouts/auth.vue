<template>
  <div class="auth-container fill-height">
    <div class="auth-panel-container">
      <VSheet
        class="auth-panel bg-primary-darken-4 d-flex"
        elevation="2"
        rounded="lg"
      >
        <div
          class="auth-header d-flex justify-start align-start w-50 pt-4 pl-7"
        >
          <div class="d-flex align-center justify-center">
            <img :src="logo" alt="Logo" class="logo" width="36" />
            <h1 class="ma-4 text-h6">{{ title }}</h1>
          </div>
        </div>
        <div class="auth-body w-50 py-7">
          <slot></slot>
        </div>
      </VSheet>
    </div>
    <div class="waves-container">
      <Waves color="31,58,84" height="15rem" slow />
    </div>
  </div>
</template>

<script>
import Waves from '@/components/auth/Waves.vue';

export default {
  name: 'AuthContainer',
  components: { Waves },
  computed: {
    title: () => 'Tailor CMS',
    logo: () => '/img/default-logo-full.svg',
  },
};
</script>

<style lang="scss">
.auth-container {
  background: #f1f1f1;
}

.auth-container .auth-panel-container {
  position: relative;
  width: 48rem;
  min-height: 41rem;
  margin: 4% auto;
}

.auth-container .auth-panel.v-sheet {
  position: absolute;
  width: 100%;
  z-index: 1;

  .auth-header {
    padding-bottom: 0;
  }

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
