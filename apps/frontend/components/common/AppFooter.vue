<template>
  <VFooter color="primary-darken-3" height="68" app>
    <div class="d-flex flex-grow-1 align-center justify-center text-body-2">
      <img
        alt="Tailor logo"
        class="py-1 mx-1"
        height="32px"
        src="/img/default-logo-compact.svg"
        width="32px"
      />
      <VChip
        class="mx-4"
        color="primary-lighten-4"
        rounded="lg"
        label
        small>
        {{ version }} {{ codename }}
      </VChip>
      Built with <VIcon class="mx-1" color="pink">mdi-heart</VIcon>
      Studion
    </div>
  </VFooter>
</template>

<script lang="ts" setup>
import { codename, version } from '@/../../package.json';
</script>
