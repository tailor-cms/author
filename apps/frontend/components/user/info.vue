<template>
  <form novalidate @submit.prevent="submit" class="pt-4 px-4 text-left">
    <VTextField
      v-model="emailInput"
      :disabled="!isEditing"
      :error-messages="errors.email"
      label="Email"
      variant="outlined"
      class="required my-2"
    />
    <VTextField
      v-model="firstNameInput"
      :disabled="!isEditing"
      :error-messages="errors.firstName"
      label="First name"
      variant="outlined"
      class="required my-2"
    />
    <VTextField
      v-model="lastNameInput"
      :disabled="!isEditing"
      :error-messages="errors.lastName"
      label="Last name"
      variant="outlined"
      class="required my-2"
    />
    <div class="d-flex justify-end pb-3">
      <template v-if="isEditing">
        <VBtn
          @click="close"
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
          Save
        </VBtn>
      </template>
      <VBtn
        v-else
        @click="isEditing = true"
        color="primary-darken-4"
        type="submit"
        variant="tonal">
        Edit
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
}

const submit = handleSubmit(async () => {
  return store.updateInfo({
    email: emailInput.value,
    firstName: firstNameInput.value,
    lastName: lastNameInput.value,
  }).then(() => {
    isEditing.value = false;
    notify('User information updated!', { immediate: true });
  }).catch(() => {
    notify('Something went wrong!', { immediate: true, color: 'error' })
  });
});
</script>
