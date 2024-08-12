<template>
  <VApp>
    <NuxtPage />
  </VApp>
</template>

<script setup lang="ts">
import { configure, defineRule } from 'vee-validate';
import { all } from '@vee-validate/rules';

Object.entries(all).forEach(([name, rule]) => {
  defineRule(name, rule);
});

configure({ validateOnModelUpdate: false });
</script>
