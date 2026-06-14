<template>
  <NuxtLayout name="main">
    <VContainer
      class="profile-page h-100 overflow-y-auto pt-14"
      max-width="1000"
    >
      <VRow>
        <VCol class="d-flex flex-column align-center mt-4" cols="12" md="4">
          <UserAvatar
            :img-url="store.user?.imgUrl"
            @save="saveAvatar"
            @delete="deleteAvatar"
          />
          <ChangePassword />
        </VCol>
        <VCol class="">
          <UserInfo />
        </VCol>
      </VRow>
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
    color: 'error',
    message: 'Are you sure you want to delete your profile picture?',
    action: () => saveAvatar(''),
  });
};
</script>

<style lang="scss" scoped>
.profile-page {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
