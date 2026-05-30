<template>
  <NuxtLayout name="auth" title="Reset password">
    <VAlert
      v-if="notificationText"
      :text="notificationText"
      :color="isError ? 'error' : 'secondary'"
      class="mb-8"
      variant="tonal"
    />
    <div v-if="isLoading" class="d-flex justify-center pt-14 pb-16">
      <VProgressCircular size="54" indeterminate />
    </div>
    <div v-else-if="isError" class="d-flex flex-column justify-center">
      <NuxtLink
        :to="{ name: 'forgot-password' }"
        class="text-center"
      >
        <VIcon size="20">mdi-arrow-top-right-thick</VIcon>
        Click here to send another reset email.
      </NuxtLink>
      <VBtn
        :to="{ name: 'sign-in' }"
        class="mt-7"
        prepend-icon="mdi-arrow-left"
        text="Sign in"
        variant="tonal"
        size="large"
      />
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <form v-else novalidate @keydown.enter="submit" @submit.prevent="submit">
      <VTextField
        v-model="passwordInput"
        :error-messages="errors.password"
        class="required mb-3"
        label="Password"
        name="password"
        placeholder="Password"
        prepend-inner-icon="mdi-lock"
        type="password"
        variant="outlined"
      />
      <VTextField
        v-model="passwordConfirmationInput"
        :error-messages="errors.passwordConfirmation"
        class="required mb-4"
        label="Re-enter password"
        name="passwordConfirmation"
        placeholder="Password confirmation"
        prepend-inner-icon="mdi-lock-outline"
        type="password"
        variant="outlined"
      />
      <VBtn
        size="large"
        type="submit"
        text="Change password"
        variant="tonal"
        block
        rounded
      />
    </form>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string, ref as yupRef } from 'yup';
import { useForm } from 'vee-validate';

import { auth as api } from '@/api';

definePageMeta({
  name: 'reset-password',
});

useHead({
  title: 'Reset password',
  meta: [{ name: 'description', content: 'Tailor CMS - Reset password page' }],
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ERRORS = {
  default: 'An error has occurred!',
  resetToken: 'Invalid reset password token!',
};

const route = useRoute();
const authStore = useAuthStore();

const isLoading = ref(true);
const isError = ref(false);
const notificationText = ref('');

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: object({
    password: string().required().min(6),
    passwordConfirmation: string()
      .required()
      .oneOf([yupRef('password')], 'Password confirmation does not match'),
  }),
});

const [passwordInput] = defineField('password');
const [passwordConfirmationInput] = defineField('passwordConfirmation');

const submit = handleSubmit(async ({ password }) => {
  try {
    await authStore.resetPassword({
      password,
      token: route.params.token as string,
    });
    isError.value = false;
    notificationText.value = 'Password changed successfully. Redirecting...';
    await delay(3000);
    navigateTo({ name: 'sign-in' });
  } catch {
    isError.value = true;
    notificationText.value = ERRORS.default;
  }
});

onMounted(async () => {
  // Make sure the loader is visible for at least 1 second
  await delay(1000);
  try {
    await api.validateResetToken(route.params.token);
  } catch {
    isError.value = true;
    notificationText.value = ERRORS.resetToken;
  } finally {
    isLoading.value = false;
  }
});
</script>
