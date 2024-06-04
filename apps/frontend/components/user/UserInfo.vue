<template>
  <form class="pt-4 px-4 text-left" novalidate @submit.prevent="submit">
    <VTextField
      v-model="emailInput"
      :disabled="!isEditing"
      :error-messages="errors.email"
      class="required my-2"
      label="Email"
      variant="outlined"
    />
    <VTextField
      v-model="firstNameInput"
      :disabled="!isEditing"
      :error-messages="errors.firstName"
      class="required my-2"
      label="First name"
      variant="outlined"
    />
    <VTextField
      v-model="lastNameInput"
      :disabled="!isEditing"
      :error-messages="errors.lastName"
      class="required my-2"
      label="Last name"
      variant="outlined"
    />
    <div class="d-flex justify-end pb-3">
      <template v-if="isEditing">
        <VBtn color="primary-darken-4" variant="text" @click="close">
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
      </template>
      <VBtn
        v-else
        color="primary-darken-4"
        type="submit"
        variant="tonal"
        @click="isEditing = true"
      >
        Edit
      </VBtn>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import pick from 'lodash/pick';
import { useForm } from 'vee-validate';

import { user as api } from '@/api';
import { useAuthStore } from '@/stores/auth';

const store = useAuthStore();
const notify = useNotification();
const isEditing = ref(false);

const { defineField, errors, handleSubmit, resetForm, meta } = useForm({
  initialValues: pick(store.user, ['email', 'firstName', 'lastName']),
  validationSchema: object({
    email: string()
      .required()
      .email()
      .test((email) => {
        if (store.user && email === (store.user as any).email) return true;
        return api.fetch({ email }).then(({ total }) => !total);
      }),
    firstName: string().min(2).required(),
    lastName: string().min(2).required(),
  }),
});

const [emailInput] = defineField('email');
const [firstNameInput] = defineField('firstName');
const [lastNameInput] = defineField('lastName');

const close = () => {
  resetForm();
  isEditing.value = false;
};

const submit = handleSubmit(() => {
  store
    .updateInfo({
      email: emailInput.value,
      firstName: firstNameInput.value,
      lastName: lastNameInput.value,
    })
    .then(() => {
      isEditing.value = false;
      notify('User information updated!', { immediate: true });
    })
    .catch(() => {
      notify('Something went wrong!', { immediate: true, color: 'error' });
    });
});
</script>
