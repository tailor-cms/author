<template>
  <VContainer>
    <VAlert class="my-5" color="success">Hi from Editor!</VAlert>
  </VContainer>
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'editor',
  middleware: ['auth'],
});
</script>
