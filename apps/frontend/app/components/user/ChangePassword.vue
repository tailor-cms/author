<template>
  <TailorDialog
    v-model="isVisible"
    header-icon="mdi-lock"
    title="Change Password"
    persistent
    @submit="submit"
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        class="mt-6"
        color="secondary"
        prepend-icon="mdi-lock"
        text="Change Password"
        variant="tonal"
      />
    </template>
    <template #body>
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
    </template>
    <template #actions>
      <NuxtLink :to="{ name: 'forgot-password' }" class="text-body-medium">
        Forgot password ?
      </NuxtLink>
      <VSpacer />
      <VBtn
        text="Cancel"
        variant="text"
        @click="close"
      />
      <VBtn
        color="primary"
        type="submit"
        text="Save"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string, ref as yupRef } from 'yup';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';

import { useAuthStore } from '@/stores/auth';

const isVisible = ref(false);

const store = useAuthStore();
const notify = useNotification();

const { defineField, errors, handleSubmit, resetForm, setFieldError } = useForm({
  validationSchema: object({
    currentPassword: string().required(),
    newPassword: string()
      .required()
      .min(8)
      .notOneOf(
        [yupRef('currentPassword')],
        'New password must be different from the current',
      ),
    passwordConfirmation: string()
      .required()
      .oneOf([yupRef('newPassword')], 'Password confirmation does not match'),
  }),
});

const [currentPasswordInput] = defineField('currentPassword');
const [newPasswordInput] = defineField('newPassword');
const [passwordConfirmationInput] = defineField('passwordConfirmation');

function handleError(err: any) {
  const status = err?.response?.status;
  const msg = err?.response?.data?.error?.message;
  if (msg && status === 422) {
    setFieldError('newPassword', msg);
    return;
  }
  if (msg && status === 400) {
    setFieldError('currentPassword', msg);
    return;
  }
  notify('Failed to change password!', { color: 'error' });
}

const submit = handleSubmit(() => {
  store
    .changePassword({
      currentPassword: currentPasswordInput.value,
      newPassword: newPasswordInput.value,
    })
    .then(() => {
      notify('Password changed!');
      store.logout();
      navigateTo('/auth');
    })
    .catch(handleError);
});

const close = () => {
  isVisible.value = false;
  resetForm();
};
</script>
