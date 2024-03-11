<template>
  <NuxtLayout name="auth">
    <VAlert
      v-if="localError"
      class="mb-7 text-left"
      color="pink-lighten-1"
      density="compact"
      closable
    >
      {{ localError }}
    </VAlert>
    <form @submit.prevent="signIn">
      <VTextField
        v-model="emailInput"
        :error-messages="errors.email"
        autocomplete="username"
        class="required mb-3"
        label="Email"
        name="email"
        placeholder="Email"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
      />
      <VTextField
        v-model="passwordInput"
        :error-messages="errors.password"
        autocomplete="current-password"
        class="required"
        label="Password"
        name="password"
        placeholder="Password"
        prepend-inner-icon="mdi-lock-outline"
        type="password"
        variant="outlined"
      />
      <div class="d-flex mt-2">
        <VBtn type="submit" variant="tonal" block rounded>Log in</VBtn>
      </div>
      <div class="options">
        <NuxtLink to="/auth/forgot-password">Forgot password?</NuxtLink>
      </div>
    </form>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { useForm } from 'vee-validate';

import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const LOGIN_ERR_MESSAGE = 'The email or password you entered is incorrect.';
const TOO_MANY_REQ_CODE = 429;
const TOO_MANY_REQ_ERR_MESSAGE =
  'Too many login attempts. Please try again later.';

const localError = ref('');

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
    password: string().required(),
  }),
});

const [emailInput] = defineField('email');
const [passwordInput] = defineField('password');

const signIn = handleSubmit(({ email, password }) => {
  localError.value = '';
  authStore
    .login({ email, password })
    .then((): any => navigateTo('/'))
    .catch((err) => {
      const code = err?.response?.status;
      localError.value =
        code === TOO_MANY_REQ_CODE
          ? TOO_MANY_REQ_ERR_MESSAGE
          : LOGIN_ERR_MESSAGE;
    });
});
</script>

<style lang="scss" scoped>
.auth-divider {
  position: relative;
  margin: 2rem 0;

  &::after {
    content: 'OR';
    position: absolute;
    top: -0.7rem;
    left: calc(50% - 1rem);
    width: 2rem;
    background: #ececec;
  }
}

.options {
  padding: 0.875rem 0 0.25rem;
  text-align: right;
}
</style>
