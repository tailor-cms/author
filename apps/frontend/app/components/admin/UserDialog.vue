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
          class="mb-3 required"
          label="Email"
          placeholder="Enter email..."
          variant="outlined"
        />
        <VTextField
          v-model="firstNameInput"
          :error-messages="errors.firstName"
          class="mb-3 required"
          label="First name"
          placeholder="Enter first name..."
          variant="outlined"
        />
        <VTextField
          v-model="lastNameInput"
          :error-messages="errors.lastName"
          class="mb-3 required"
          label="Last name"
          placeholder="Enter last name..."
          variant="outlined"
        />
        <VSelect
          v-model="roleInput"
          :error-messages="errors.role"
          :items="roles"
          class="role-select mb-3 required"
          item-title="title"
          item-value="value"
          label="Role"
          placeholder="Select role..."
          variant="outlined"
        >
          <template #item="{ item, props: itemProps }">
            <VListItem
              v-bind="itemProps"
              :subtitle="item.raw.description"
              class="py-3"
            />
          </template>
        </VSelect>
        <VSelect
          v-model="groupInput"
          :error-messages="errors.userGroupIds"
          :items="userGroups"
          class="user-group-select mb-3"
          item-title="name"
          item-value="id"
          label="User Group"
          placeholder="Select user group..."
          variant="outlined"
          chips
          clearable
          closable-chips
          multiple
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
import { isEmpty, map } from 'lodash-es';
import { object, string } from 'yup';
import { role } from '@tailor-cms/common';
import { TailorDialog } from '@tailor-cms/core-components';
import { titleCase } from '@tailor-cms/utils';
import { useForm } from 'vee-validate';
import type { User } from '@tailor-cms/interfaces/user';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import { user as api } from '@/api';

const UserRole = role.user;

export interface Props {
  visible?: boolean;
  userData?: any;
  users: User[];
  userGroups: UserGroup[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userData: {},
});

const emit = defineEmits(['created', 'updated', 'update:visible']);

const availableRoles = {
  [UserRole.COLLABORATOR]: 'Can access only assigned repositories',
  [UserRole.USER]: 'Can create new and access assigned repositories',
  [UserRole.ADMIN]: 'Can fully manage the application and access all data',
};

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const isReinviting = ref(false);
const isNewUser = computed(() => !props.userData?.id);
const roles = computed(() =>
  map(availableRoles, (description, value) => ({
    title: titleCase(value),
    value,
    description,
  })),
);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    email: string()
      .required()
      .email()
      .test({
        message: 'Email is already taken',
        test: (email) => {
          if (!isNewUser.value) return true;
          if (props.userData.email === email) return true;
          return api.fetch({ email }).then(({ total }) => !total);
        },
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
const [groupInput] = defineField('userGroupIds');

watch(isDialogVisible, (val) => {
  if (!val) return;
  if (!isEmpty(props.userData)) {
    emailInput.value = props.userData.email;
    firstNameInput.value = props.userData.firstName;
    lastNameInput.value = props.userData.lastName;
    roleInput.value = props.userData.role;
    groupInput.value = props.userData?.userGroups
      ?.map((it: UserGroup) => it.id) || [];
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
    userGroupIds: groupInput.value,
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
