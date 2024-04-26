<template>
  <VApp>
    <NuxtPage />
  </VApp>
</template>

<script setup lang="ts">
import { configure } from 'vee-validate';

configure({ validateOnModelUpdate: false });
</script>
