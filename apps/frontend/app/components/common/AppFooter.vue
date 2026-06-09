<template>
  <VFooter color="surface-container" height="68" app>
    <div class="d-flex flex-grow-1 align-center justify-center text-body-medium">
      <img
        alt="Tailor logo"
        class="py-1 mx-1"
        height="32px"
        src="/img/default-logo-compact.svg"
        width="32px"
      />
      <VChip
        :text="`${version} ${codename}`"
        class="mx-4"
        rounded="lg"
        label
        small
      />
      Built with <VIcon class="mx-1" color="pink">mdi-heart</VIcon>
      Studion
    </div>
  </VFooter>
</template>

<script lang="ts" setup>
import { codename, version } from '@/../../../package.json' with { type: 'json' };
</script>
