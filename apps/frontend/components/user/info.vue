<template>
  <form @submit.prevent="submit" class="pt-4 px-4">
    <VTextField
      v-model="emailInput"
      :error-messages="errors.email"
      label="Email"
      variant="outlined"
      class="required"
    />
    <VTextField
      v-model="firstNameInput"
      :error-messages="errors.firstName"
      label="First name"
      variant="outlined"
      class="required"
    />
    <VTextField
      v-model="lastNameInput"
      :error-messages="errors.lastName"
      label="Last name"
      variant="outlined"
      class="required"
    />
    <div class="d-flex justify-end pb-3">
      <VBtn
        @click="resetForm"
        :disabled="!meta.dirty"
        color="primary-darken-4"
        variant="text">
        Cancel
      </VBtn>
      <VBtn
        :disabled="!meta.dirty"
        class="ml-2 px-4"
        color="primary-darken-4"
        type="submit"
        variant="tonal"
      >
        Update
      </VBtn>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { useForm } from 'vee-validate';
import { useAuthStore } from '@/stores/auth';
import { user as api } from '@/api';
import pick from 'lodash/pick';

const store = useAuthStore();
const notify = useNotification();

const { defineField, errors, handleSubmit, resetForm, meta } = useForm({
  initialValues: pick(store.user, ['email', 'firstName', 'lastName']),
  validationSchema: object({
    email: string()
      .required()
      .email()
      .test('unique-email', async (email) => {
        const user = await api.fetch({ email });
        return !user.length;
      }),
    firstName: string().min(2).required(),
    lastName: string().min(2).required(),
  }),
});

const [emailInput] = defineField('email');
const [firstNameInput] = defineField('firstName');
const [lastNameInput] = defineField('lastName');

const submit = handleSubmit(async () => {
  await store.updateInfo({
    email: emailInput.value,
    firstName: firstNameInput.value,
    lastName: lastNameInput.value,
  });
  resetForm();
  notify('User information updated!', { immediate: true });
});
</script>
