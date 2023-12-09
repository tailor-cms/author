<template>
  <div class="auth-container fill-height">
    <div class="auth-panel-container">
      <VSheet class="auth-panel" elevation="0" rounded>
        <div class="auth-header d-flex flex-column align-center py-9">
          <VAvatar class="elevation-3" color="primary-darken-4" size="108">
            <div class="pt-2">
              <img :src="logo" alt="Logo" class="logo" />
            </div>
          </VAvatar>
          <h1 class="ma-4 text-h5">{{ title }}</h1>
        </div>
        <div class="auth-body">
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
    title: () => 'Tailor',
    logo: () => '/img/default-logo-compact.svg',
  },
};
</script>

<style lang="scss">
.auth-container {
  background: #f1f1f1;
}

.auth-container .auth-panel-container {
  position: relative;
  width: 26rem;
  min-height: 41rem;
  margin: 4% auto;
}

.auth-container .auth-panel.v-sheet {
  position: absolute;
  width: 100%;
  background: rgba($color: #e1e1e1, $alpha: 0.3);
  border: 1px dashed #777;
  z-index: 1;

  .auth-header {
    padding-bottom: 0;

    .logo {
      max-width: 3.5rem;
    }
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
