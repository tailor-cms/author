<template>
  <TailorDialog v-model="isVisible" header-icon="mdi-lock" persistent>
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        color="primary-darken-4"
        prepend-icon="mdi-lock"
        variant="tonal"
        class="mt-4"
      >
        Change Password
      </VBtn>
    </template>
    <template #header>Change Password</template>
    <template #body>
      <form novalidate @submit.prevent="submit">
        <VTextField
          v-model="currentPasswordInput"
          :error-messages="errors.currentPassword"
          type="password"
          label="Current password"
          placeholder="Enter current password..."
          variant="outlined"
          class="required my-4"
        />
        <VTextField
          v-model="newPasswordInput"
          :error-messages="errors.newPassword"
          type="password"
          label="New password"
          placeholder="Enter new password..."
          variant="outlined"
          class="required mb-4"
        />
        <VTextField
          v-model="passwordConfirmationInput"
          :error-messages="errors.passwordConfirmation"
          type="password"
          label="Confirm new password"
          placeholder="Confirm new password..."
          variant="outlined"
          class="required mb-4"
        />
        <div class="d-flex align-center pl-2 py-4">
          <NuxtLink :to="{ name: 'forgot-password' }">
            Forgot password ?
          </NuxtLink>
          <VBtn @click="close" variant="text" class="ml-auto">Cancel</VBtn>
          <VBtn
            type="submit"
            color="primary-darken-4"
            variant="tonal"
          >
            Save
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import TailorDialog from '@/components/common/TailorDialog.vue';
import { object, string, ref as yupRef } from 'yup';
import { useForm } from 'vee-validate';
import { useAuthStore } from '@/stores/auth';

const store = useAuthStore();
const notify = useNotification();

const { defineField, errors, handleSubmit, resetForm, meta } = useForm({
  validationSchema: object({
    currentPassword: string().required(),
    newPassword: string()
      .required()
      .min(6)
      .notOneOf(
        [yupRef('currentPassword')],
        'new password must be different from the current'
      ),
    passwordConfirmation: string()
      .required()
      .oneOf([yupRef('newPassword')], 'password confirmation does not match'),

  }),
});

const isVisible = ref(false);

const [currentPasswordInput] = defineField('currentPassword');
const [newPasswordInput] = defineField('newPassword');
const [passwordConfirmationInput] = defineField('passwordConfirmation');


const submit = handleSubmit(async () => {
  return store.changePassword({
    currentPassword: currentPasswordInput.value,
    newPassword: newPasswordInput.value,
  }).then(() => {
    notify('Password changed!', { immediate: true });
    store.logout();
    navigateTo('/auth');
  }).catch(() => {
    notify('Failed to change password!', { immediate: true, color: 'error' })
  });
});

const close = () => {
  isVisible.value = false;
  resetForm();
};
</script>
