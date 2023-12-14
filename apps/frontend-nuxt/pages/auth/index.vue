<template>
  <NuxtLayout name="auth">
    <VAlert
      v-if="errorMessage"
      class="mb-7 text-left"
      color="pink-lighten-1"
      density="compact"
      closable
    >
      {{ errorMessage }}
    </VAlert>
    <template v-if="oidcEnabled">
      <VBtn color="pink-accent-4" block rounded @click="signInWithOIDC">
        {{ oidcLoginText }}
      </VBtn>
      <VDivider class="auth-divider" />
    </template>
    <form @submit.prevent="signIn">
      <VTextField
        v-model="emailInput"
        :error-messages="errors.email"
        autocomplete="username"
        class="required mb-1"
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
      <div class="d-flex mt-1">
        <VSpacer />
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

const getOidcErrorMessage = (email: string, buttonLabel: string) =>
  `Account with email ${email} does not exist.
  Click "${buttonLabel}" to try with a different account.`;

const oidcEnabled = computed((vm) => vm?.$oidc?.enabled);
const oidcLoginText = computed(
  () => process.env?.OIDC_LOGIN_TEXT || 'Login with OAuth',
);

const accessDenied = computed((vm) => vm?.$route?.query?.accessDenied);
const oidcError = computed(
  () =>
    accessDenied.value &&
    getOidcErrorMessage(accessDenied.value, oidcLoginText.value),
);

const localError = ref('');
const errorMessage = computed(() => oidcError.value || localError.value);

const signInWithOIDC = () => {
  const action = oidcError.value ? 'reauthenticate' : 'authenticate';
  this?.$oidc?.[action]();
};

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
