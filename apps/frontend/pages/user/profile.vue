<template>
  <NuxtLayout name="main">
    <VContainer>
      <VRow>
        <VCol>
          <VAlert color="primary-lighten-3" variant="tonal">
            Hello, User!
          </VAlert>
        </VCol>
      </VRow>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'user-profile',
  middleware: ['auth'],
});
</script>
