<template>
  <NuxtLayout name="auth" title="Forgot password?">
    <VAlert
      :text="errorMessage || 'Sending reset email...'"
      :color="errorMessage ? 'error' : ''"
      :model-value="showMessage"
      class="mb-8 pa-4 text-title-small"
      variant="tonal"
      prominent
    />
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <form
      v-if="!errorMessage"
      novalidate
      @keydown.enter="submit"
      @submit.prevent="submit"
    >
      <VTextField
        v-model="emailInput"
        class="mb-4"
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
          size="large"
          type="submit"
          text="Send reset email"
          variant="tonal"
          block
          rounded
        />
        <VBtn
          class="mt-7"
          prepend-icon="mdi-arrow-left"
          text="Back"
          variant="text"
          @click.stop="$router.back()"
        />
      </div>
    </form>
    <VBtn
      v-else
      text="Retry"
      variant="tonal"
      block
      rounded
      @click.stop="resetInput"
    />
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
