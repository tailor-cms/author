<template>
  <NuxtLayout name="auth" title="Forgot password?">
    <VAlert
      :color="errorMessage ? 'pink-lighten-4' : 'teal-lighten-4'"
      :model-value="showMessage"
      class="mb-8 pa-4 text-subtitle-2"
      variant="tonal"
      prominent
    >
      {{ errorMessage || 'Sending reset email...' }}
    </VAlert>
    <form v-if="!errorMessage" novalidate @submit.prevent="submit">
      <VTextField
        v-model="emailInput"
        :class="errors.email?.length ? 'mb-3' : 'mb-1'"
        :disabled="showMessage"
        :error-messages="errors.email"
        label="Email"
        placeholder="Email"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
      />
      <div>
        <VBtn
          v-if="!showMessage"
          color="primary-lighten-2"
          type="submit"
          variant="tonal"
          block
          rounded
        >
          Send reset email
        </VBtn>
        <VBtn
          :to="{ name: 'sign-in' }"
          class="mt-7"
          color="primary-lighten-3"
          variant="text"
        >
          <VIcon class="pr-2">mdi-arrow-left</VIcon>Back
        </VBtn>
      </div>
    </form>
    <VBtn
      v-else
      color="primary-lighten-2"
      variant="tonal"
      block
      rounded
      @click.stop="resetInput">
      Retry
    </VBtn>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import Promise from 'bluebird';
import { useForm } from 'vee-validate';

definePageMeta({
  name: 'forgot-password',
});

useHead({
  title: 'Request password reset',
  meta: [
    {
      name: 'description',
      content: 'Tailor CMS - Request password reset page',
    },
  ],
});

const authStore = useAuthStore();

const errorMessage = ref('');
const showMessage = ref(false);

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
  }),
});
const [emailInput] = defineField('email');

const submit = handleSubmit(({ email }) => {
  showMessage.value = true;
  Promise.all([authStore.forgotPassword({ email }), Promise.delay(5000)])
    .then((): any => navigateTo('/'))
    .catch(() => (errorMessage.value = 'Something went wrong!'));
});

const resetInput = () => {
  emailInput.value = '';
  errorMessage.value = '';
  showMessage.value = false;
};
</script>
