<template>
  <TailorDialog v-model="isDialogVisible" header-icon="mdi-account" persistent>
    <template #header>{{ isNewUser ? 'Create' : 'Edit' }} User</template>
    <template #body>
      <VBtn
        v-if="userData?.id"
        :disabled="isReinviting"
        :loading="isReinviting"
        class="d-block ml-auto mb-4"
        color="primary-darken-4"
        variant="tonal"
        @click="reinvite"
      >
        Reinvite
      </VBtn>
      <form class="form" novalidate @submit.prevent="submit">
        <VTextField
          v-model="emailInput"
          :disabled="!isNewUser"
          :error-messages="errors.email"
          class="mb-3"
          label="E-mail"
          placeholder="Enter email..."
          variant="outlined"
        />
        <VTextField
          v-model="firstNameInput"
          :error-messages="errors.firstName"
          class="mb-3"
          label="First name"
          placeholder="Enter first name..."
          variant="outlined"
        />
        <VTextField
          v-model="lastNameInput"
          :error-messages="errors.lastName"
          class="mb-3"
          label="Last name"
          placeholder="Enter last name..."
          variant="outlined"
        />
        <VSelect
          v-model="roleInput"
          :error-messages="errors.role"
          :items="roles"
          class="mb-3"
          item-title="title"
          item-value="value"
          label="Role"
          placeholder="Select role..."
          variant="outlined"
        />
        <div class="d-flex justify-end pb-3">
          <VBtn color="primary-darken-4" variant="text" @click="close">
            Cancel
          </VBtn>
          <VBtn
            :disabled="!!errors?.length"
            class="ml-2 px-4"
            color="primary-darken-2"
            type="submit"
            variant="tonal"
          >
            Save
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import { role } from 'tailor-config-shared';
import { title as titleCase } from 'to-case';
import { useForm } from 'vee-validate';

import { user as api } from '@/api';
import TailorDialog from '@/components/common/TailorDialog.vue';
import type { User } from '@/api/interfaces/user';

export interface Props {
  visible: boolean;
  userData: any;
  users: User[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userData: {},
});

const emit = defineEmits(['created', 'updated', 'update:visible']);

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const isReinviting = ref(false);
const isNewUser = computed(() => !props.userData?.id);
const roles = computed(() =>
  map(role.repository, (value) => ({ title: titleCase(value), value })),
);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    email: string()
      .required()
      .email()
      .test((email) => {
        if (isNewUser.value) return true;
        return api.fetch({ email }).then(({ total }) => !total);
      }),
    firstName: string().min(2).required(),
    lastName: string().min(2).required(),
    role: string().required(),
  }),
});

const [emailInput] = defineField('email');
const [firstNameInput] = defineField('firstName');
const [lastNameInput] = defineField('lastName');
const [roleInput] = defineField('role');

watch(isDialogVisible, (val) => {
  if (!val) return;
  if (!isEmpty(props.userData)) {
    emailInput.value = props.userData.email;
    firstNameInput.value = props.userData.firstName;
    lastNameInput.value = props.userData.lastName;
    roleInput.value = props.userData.role;
  } else {
    resetForm();
  }
});

const close = () => {
  emit('update:visible', false);
  resetForm();
};

const submit = handleSubmit(async () => {
  const action = isNewUser.value ? 'create' : 'update';
  await api.upsert({
    id: props.userData?.id,
    email: emailInput.value,
    firstName: firstNameInput.value,
    lastName: lastNameInput.value,
    role: roleInput.value,
  });
  emit(`${action}d`);
  close();
});

const reinvite = () => {
  isReinviting.value = true;
  api
    .reinvite({ id: props.userData.id })
    .finally(() => (isReinviting.value = false));
};
</script>
