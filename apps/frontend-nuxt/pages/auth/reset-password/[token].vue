<template>
  <NuxtLayout name="auth">
    <VAlert
      v-if="message"
      :color="isError ? 'pink-lighten-1' : 'success'"
      class="mb-8"
      variant="tonal"
    >
      {{ message }}
    </VAlert>
    <div v-if="isLoading" class="d-flex justify-center">
      <VProgressCircular color="primary-darken-2" indeterminate />
    </div>
    <div v-else-if="isError" class="d-flex flex-column justify-center">
      <NuxtLink :to="{ path: '/auth/forgot-password' }" class="text-center">
        <VIcon size="20">mdi-arrow-top-right-thick</VIcon>
        Click here to send another reset email.
      </NuxtLink>
      <VBtn class="mt-7" to="/auth" variant="tonal">
        <VIcon class="pr-2">mdi-arrow-left</VIcon>Back to login page
      </VBtn>
    </div>
    <form v-else @submit.prevent="submit" novalidate>
      <VTextField
        v-model="passwordInput"
        :error-messages="errors.password"
        type="password"
        name="password"
        label="Password"
        placeholder="Password"
        prepend-inner-icon="mdi-lock"
        variant="outlined"
        class="required mb-3"
      />
      <VTextField
        v-model="passwordConfirmationInput"
        :error-messages="errors.passwordConfirmation"
        type="password"
        name="passwordConfirmation"
        label="Re-enter password"
        placeholder="Password confirmation"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        class="required mb-4"
      />
      <VBtn
        type="submit"
        color="primary-darken-4"
        variant="tonal"
        rounded
        block
      >
        Change password
      </VBtn>
    </form>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, ref as yupRef, string } from 'yup';
import { auth as api } from '@/api';
import { delay } from 'bluebird';
import { useForm } from 'vee-validate';

const ERRORS = {
  default: 'An error has occurred!',
  resetToken: 'Invalid reset password token!',
};

const route = useRoute();
const authStore = useAuthStore();
const isLoading = ref(true);
const isError = ref(false);
const message = ref('');

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: object({
    password: string().required().min(6),
    passwordConfirmation: string()
      .required()
      .oneOf([yupRef('password')], 'password confirmation does not match'),
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
    message.value = 'Password changed successfully. Redirecting...';
    await delay(2000);
    navigateTo('/');
  } catch {
    isError.value = true;
    message.value = ERRORS.default;
  }
});

onMounted(async () => {
  try {
    await api.validateResetToken(route.params.token);
  } catch {
    isError.value = true;
    message.value = ERRORS.resetToken;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.v-input ::v-deep label {
  padding-right: 0.25rem;
  background: #ececec;
}
</style>
