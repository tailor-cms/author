<template>
  <NuxtLayout name="main">
    <VContainer class="h-100 pt-14">
      <ChangePassword />
      <VSheet color="primary-lighten-4" rounded="lg">
        <Info />
      </VSheet>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import ChangePassword from '~/components/user/ChangePassword.vue';
import Info from '~/components/user/info.vue';

definePageMeta({
  name: 'user-profile',
  middleware: ['auth'],
});
</script>
