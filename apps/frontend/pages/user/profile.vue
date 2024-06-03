<template>
  <NuxtLayout name="main">
    <VContainer class="h-100 pt-14">
      <ChangePassword />
      <UserAvatar />
      <VSheet color="primary-lighten-4" rounded="lg">
        <Info />
      </VSheet>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import ChangePassword from '@/components/user/ChangePassword.vue';
import Info from '@/components/user/info.vue';
import UserAvatar from '@/components/user/Avatar/index.vue';

definePageMeta({
  name: 'user-profile',
  middleware: ['auth'],
});
</script>
