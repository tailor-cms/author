<template>
  <NuxtLayout name="auth" title="Sign in">
    <VAlert
      v-if="errorMessage"
      class="mb-7 text-left"
      color="pink-lighten-4"
      density="compact"
      variant="tonal"
      closable
    >
      {{ errorMessage }}
    </VAlert>
    <div v-if="config.props.oidcEnabled" class="mt-4">
      <VBtn
        color="blue-lighten-4"
        data-testid="auth_oidcLoginBtn"
        variant="tonal"
        block
        rounded
        @click="loginOIDC"
      >
        <VIcon v-if="config.oidcLoginText.includes('Google')" class="mr-2" left>
          mdi-google
        </VIcon>
        {{ config.oidcLoginText }}
      </VBtn>
      <VDivider class="my-10" />
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions-->
    <form novalidate @keydown.enter="signIn" @submit.prevent="signIn">
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
      <VBtn
        color="primary-lighten-4"
        variant="tonal"
        block
        rounded
        @click="signIn"
      >
        Sign in
      </VBtn>
      <div class="options">
        <NuxtLink :to="{ name: 'forgot-password' }">Forgot password?</NuxtLink>
      </div>
    </form>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { useForm } from 'vee-validate';

import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';

const LOGIN_ERR_MESSAGE = 'The email or password you entered is incorrect.';
const TOO_MANY_REQ_CODE = 429;
const TOO_MANY_REQ_ERR_MESSAGE =
  'Too many login attempts. Please try again later.';

const getOidcErrorMessage = (email: any, buttonLabel: string) =>
  `Account with email ${email} does not exist.
  Click "${buttonLabel}" to try with a different account.`;

definePageMeta({
  name: 'sign-in',
});

useHead({
  title: 'Sign in',
  meta: [{ name: 'description', content: 'Tailor CMS - Sign in page' }],
});

const localError = ref('');

const { $oidc } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();
const route = useRoute();

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
    password: string().required(),
  }),
});

const [emailInput] = defineField('email');
const [passwordInput] = defineField('password');

const accessDenied = computed(() => route.query.accessDenied);
const oidcError = computed(() => {
  if (!accessDenied.value) return;
  return getOidcErrorMessage(accessDenied.value, config.oidcLoginText);
});
const errorMessage = computed(() => oidcError.value || localError.value);

const loginOIDC = () => {
  const action = oidcError.value ? 'reauthenticate' : 'authenticate';
  $oidc[action]();
};

const signIn = handleSubmit(({ email, password }) => {
  localError.value = '';
  authStore
    .login({ email, password })
    .then(async () => {
      const isAuthenticated = useCookie('is-authenticated');
      isAuthenticated.value = 'true';
      await authStore.fetchUserInfo();
      navigateTo('/');
    })
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
.options {
  padding: 0.875rem 0 0.25rem;
  text-align: right;
}

.v-alert :deep(.mdi-close) {
  color: #eee;
}
</style>
