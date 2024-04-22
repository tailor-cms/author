<template>
  <NuxtLayout name="main">
    <VContainer>
      <VRow>
        <VCol>
          <VAlert color="primary-lighten-3" variant="tonal">
            Hello, Admin!
          </VAlert>
        </VCol>
      </VRow>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'admin',
  middleware: ['auth'],
});
</script>
