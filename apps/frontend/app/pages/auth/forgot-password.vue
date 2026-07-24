<template>
  <NuxtLayout name="auth" title="Forgot password?">
    <VSlideYTransition mode="out-in">
      <div v-if="isSubmitted" key="confirmation">
        <VAlert
          class="mb-8 pa-4"
          type="success"
          variant="tonal"
        >
          <VAlertTitle class="text-title-medium font-weight-semibold mb-2">
            Check your inbox
          </VAlertTitle>
          <p class="text-body-medium">
            If an account is associated with
            <span class="font-weight-semibold">{{ submittedEmail }}</span>,
            we've just sent a password reset link.
          </p>
          <p class="text-body-small opacity-80 mt-1">
            It may take a few minutes to arrive. Remember to check your spam
            folder.
          </p>
        </VAlert>
        <VBtn
          :to="{ name: 'sign-in' }"
          color="primary"
          prepend-icon="mdi-arrow-left"
          size="large"
          text="Back to sign in"
          variant="tonal"
          block
          rounded
        />
      </div>
      <div v-else-if="errorMessage" key="error">
        <VAlert
          class="mb-8 pa-4"
          type="error"
          variant="tonal"
        >
          <VAlertTitle class="text-title-medium font-weight-semibold mb-2">
            {{ errorMessage }}
          </VAlertTitle>
          <p class="text-body-medium">
            We couldn't send the reset email. Check your connection and try
            again.
          </p>
        </VAlert>
        <VBtn
          color="primary"
          prepend-icon="mdi-refresh"
          size="large"
          text="Retry"
          variant="flat"
          block
          rounded
          @click.stop="resetInput"
        />
      </div>
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <form
        v-else
        key="form"
        novalidate
        @keydown.enter="submit"
        @submit.prevent="submit"
      >
        <VTextField
          v-model="emailInput"
          class="mb-4"
          :disabled="isSubmitting"
          :error-messages="errors.email"
          label="Email"
          placeholder="Email"
          prepend-inner-icon="mdi-email-outline"
          type="email"
          variant="outlined"
        />
        <div>
          <VBtn
            color="primary"
            size="large"
            type="submit"
            text="Send reset email"
            :loading="isSubmitting"
            variant="flat"
            block
            rounded
          />
          <VBtn
            class="mt-7"
            prepend-icon="mdi-arrow-left"
            text="Back"
            :disabled="isSubmitting"
            variant="text"
            @click.stop="$router.back()"
          />
        </div>
      </form>
    </VSlideYTransition>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import pMinDelay from 'p-min-delay';
import { useForm } from 'vee-validate';

// Hold the loading state briefly so the confirmation doesn't flash when the
// backend replies almost instantly.
const MIN_LOADING_MS = 800;

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
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const submittedEmail = ref('');

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
  }),
});
const [emailInput] = defineField('email');

const submit = handleSubmit(({ email }) => {
  isSubmitting.value = true;
  pMinDelay(authStore.forgotPassword({ email }), MIN_LOADING_MS)
    .then(() => {
      submittedEmail.value = email;
      isSubmitted.value = true;
    })
    .catch(() => (errorMessage.value = 'Something went wrong!'))
    .finally(() => (isSubmitting.value = false));
});

const resetInput = () => {
  emailInput.value = '';
  errorMessage.value = '';
  isSubmitting.value = false;
  isSubmitted.value = false;
};
</script>
