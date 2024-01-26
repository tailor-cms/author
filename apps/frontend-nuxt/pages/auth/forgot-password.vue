<template>
  <NuxtLayout name="auth">
    <VAlert
      :color="error ? 'pink-lighten-1' : 'grey-darken-4'"
      :model-value="!!showMessage"
      class="mb-8"
      density="compact"
      variant="tonal"
    >
      {{ error || 'Sending reset email...' }}
    </VAlert>
    <form v-if="!error" novalidate @submit.prevent="submit">
      <VTextField
        v-model="emailInput"
        :error-messages="errors.email"
        class="required"
        label="Email"
        placeholder="Email"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
      />
      <div>
        <VBtn
          v-if="!showMessage"
          color="primary darken-4"
          type="submit"
          variant="tonal"
          block
          rounded
        >
          Send reset email
        </VBtn>
        <VBtn class="mt-7" to="/" variant="text">
          <VIcon class="pr-2">mdi-arrow-left</VIcon>Back
        </VBtn>
      </div>
    </form>
    <VBtn v-else variant="text" @click.stop="resetInput">Retry</VBtn>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { delay } from 'bluebird';
import { useForm } from 'vee-validate';

const authStore = useAuthStore();

const showMessage = ref(false);
const error = ref('');

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
  }),
});

const [emailInput] = defineField('email');

const submit = handleSubmit(({ email }) => {
  showMessage.value = true;
  Promise.all([authStore.forgotPassword({ email }), delay(5000)])
    .then((): any => navigateTo('/'))
    .catch(() => (error.value = 'Something went wrong!'));
});

const resetInput = () => {
  emailInput.value = '';
};
</script>
