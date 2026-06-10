<template>
  <form class="pt-4 px-4 text-left" novalidate @submit.prevent="submit">
    <VTextField
      v-model="emailInput"
      :error-messages="errors.email"
      class="required my-2"
      label="Email"
      variant="outlined"
    />
    <VTextField
      v-model="firstNameInput"
      :error-messages="errors.firstName"
      class="required my-2"
      label="First name"
      variant="outlined"
    />
    <VTextField
      v-model="lastNameInput"
      :error-messages="errors.lastName"
      class="required my-2"
      label="Last name"
      variant="outlined"
    />
    <div class="d-flex justify-end pb-3">
      <VBtn
        :disabled="!meta.dirty"
        color="primary-darken-4"
        variant="text"
        @click="resetForm"
      >
        Cancel
      </VBtn>
      <VBtn
        :disabled="!meta.dirty"
        class="ml-2 px-4"
        color="primary-darken-4"
        type="submit"
        variant="tonal"
      >
        Save
      </VBtn>
    </div>
  </form>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';
import { object, string } from 'yup';
import { useForm } from 'vee-validate';

import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';

const store = useAuthStore();
const notify = useNotification();

const initialFormValues = (user: User | null) => ({
  email: user?.email,
  firstName: user?.firstName ?? undefined,
  lastName: user?.lastName ?? undefined,
});

const { defineField, errors, handleSubmit, resetForm, meta } = useForm({
  initialValues: initialFormValues(store.user),
  validationSchema: object({
    email: string()
      .required()
      .email()
      .test({
        message: 'Email is already taken',
        test: (email) => {
          if (store.user && email === (store.user as any).email) return true;
          return api.user
            .list({ query: { email } })
            .then(({ total }) => !total);
        },
      }),
    firstName: string().required().min(2),
    lastName: string().required().min(2),
  }),
});

const [emailInput] = defineField('email');
const [firstNameInput] = defineField('firstName');
const [lastNameInput] = defineField('lastName');

const submit = handleSubmit(() => {
  store
    .updateInfo({
      email: emailInput.value,
      firstName: firstNameInput.value,
      lastName: lastNameInput.value,
    })
    .then(() => {
      notify('User information updated!', { immediate: true });
      resetForm({ values: initialFormValues(store.user) });
    })
    .catch(() => {
      notify('Something went wrong!', { immediate: true, color: 'error' });
    });
});
</script>
