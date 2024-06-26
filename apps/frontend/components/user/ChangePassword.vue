<template>
  <TailorDialog v-model="isVisible" header-icon="mdi-lock" persistent>
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        class="mt-6"
        color="primary-darken-4"
        prepend-icon="mdi-lock"
        variant="tonal"
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
          class="required mb-4"
          label="Current password"
          placeholder="Enter current password..."
          type="password"
          variant="outlined"
        />
        <VTextField
          v-model="newPasswordInput"
          :error-messages="errors.newPassword"
          class="required mb-4"
          label="New password"
          placeholder="Enter new password..."
          type="password"
          variant="outlined"
        />
        <VTextField
          v-model="passwordConfirmationInput"
          :error-messages="errors.passwordConfirmation"
          class="required mb-4"
          label="Confirm new password"
          placeholder="Confirm new password..."
          type="password"
          variant="outlined"
        />
        <div class="d-flex align-center pl-2 py-4">
          <NuxtLink :to="{ name: 'forgot-password' }" class="text-primary">
            Forgot password ?
          </NuxtLink>
          <VBtn
            class="ml-auto"
            color="primary-darken-4"
            variant="text"
            @click="close"
          >
            Cancel
          </VBtn>
          <VBtn
            class="ml-2"
            color="primary-darken-4"
            type="submit"
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
import { object, string, ref as yupRef } from 'yup';
import { useForm } from 'vee-validate';

import TailorDialog from '@/components/common/TailorDialog.vue';
import { useAuthStore } from '@/stores/auth';

const isVisible = ref(false);

const store = useAuthStore();
const notify = useNotification();

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    currentPassword: string().required().label('Current password'),
    newPassword: string()
      .required()
      .min(6)
      .notOneOf(
        [yupRef('currentPassword')],
        'New password must be different from the current',
      )
      .label('New password'),
    passwordConfirmation: string()
      .required()
      .oneOf([yupRef('newPassword')], 'Password confirmation does not match')
      .label('Password confirmation'),
  }),
});

const [currentPasswordInput] = defineField('currentPassword');
const [newPasswordInput] = defineField('newPassword');
const [passwordConfirmationInput] = defineField('passwordConfirmation');

const submit = handleSubmit(() => {
  store
    .changePassword({
      currentPassword: currentPasswordInput.value,
      newPassword: newPasswordInput.value,
    })
    .then(() => {
      notify('Password changed!', { immediate: true });
      store.logout();
      navigateTo('/auth');
    })
    .catch(() => {
      notify('Failed to change password!', { immediate: true, color: 'error' });
    });
});

const close = () => {
  isVisible.value = false;
  resetForm();
};
</script>
