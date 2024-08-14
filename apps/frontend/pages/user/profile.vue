<template>
  <NuxtLayout name="main">
    <VContainer class="h-100 pt-14 user-panel">
      <VSheet color="primary-lighten-4" rounded="lg">
        <VLayout>
          <VRow class="ma-2">
            <VCol
              class="d-flex flex-column align-center justify-center"
              cols="12"
              md="5"
            >
              <UserAvatar />
              <ChangePassword />
            </VCol>
            <VCol>
              <VSheet color="primary-lighten-5" rounded="lg">
                <UserInfo />
              </VSheet>
            </VCol>
          </VRow>
        </VLayout>
      </VSheet>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import ChangePassword from '@/components/user/ChangePassword.vue';
import UserAvatar from '@/components/user/Avatar/index.vue';
import UserInfo from '@/components/user/UserInfo.vue';

useHead({
  title: 'User profile',
});

definePageMeta({
  name: 'user-profile',
  middleware: ['auth'],
});
</script>

<style lang="scss" scoped>
.user-panel {
  max-width: 75rem;
}
</style>
