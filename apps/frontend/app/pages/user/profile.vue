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
              <UserAvatar
                :img-url="store.user?.imgUrl"
                @save="saveAvatar"
                @delete="deleteAvatar"
              />
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
import UserAvatar from '@/components/common/Avatar/index.vue';
import UserInfo from '@/components/user/UserInfo.vue';

useHead({
  title: 'User profile',
});

definePageMeta({
  name: 'user-profile',
  middleware: ['auth'],
});

const store = useAuthStore();
const notify = useNotification();

const saveAvatar = (imgUrl?: string) => {
  return store.updateInfo({ imgUrl }).then(() => {
    notify('Your profile picture has been updated!', { immediate: true });
  });
};

const deleteAvatar = () => {
  const showConfirmationDialog = useConfirmationDialog();
  showConfirmationDialog({
    title: 'Delete avatar?',
    message: 'Are you sure you want to delete your profile picture?',
    action: () => saveAvatar(''),
  });
};
</script>

<style lang="scss" scoped>
.user-panel {
  max-width: 75rem;
}
</style>
