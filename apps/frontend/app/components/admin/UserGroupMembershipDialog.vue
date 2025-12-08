<template>
  <TailorDialog v-model="isVisible" header-icon="mdi-account" persistent>
    <template #activator="{ props: activatorProps }">
      <VBtn
        v-bind="activatorProps"
        aria-label="Add users to the group"
        class="add-user"
        color="primary-darken-2"
        prepend-icon="mdi-plus"
        size="small"
        variant="tonal"
      >
        Add user
      </VBtn>
    </template>
    <template #header>Add users to the user group</template>
    <template #body>
      <form novalidate @submit.prevent="submit">
        <VCombobox
          ref="emailInputEl"
          v-model="emailInput"
          :clear-on-select="false"
          :error-messages="errors.email"
          :items="suggestedUsers"
          class="required mb-4"
          item-title="email"
          item-value="email"
          label="Email"
          placeholder="Enter email..."
          variant="outlined"
          chips
          clearable
          closable-chips
          multiple
          @update:focused="onEmailInputFocusChange"
          @update:model-value="onEmailValueChange"
          @update:search="fetchUsers"
        />
        <VSelect
          v-model="roleInput"
          :error-messages="errors.role"
          :items="roles"
          aria-label="Role"
          class="group-role-select required mt-4 mb-1"
          label="Role"
          placeholder="Role..."
          variant="outlined"
        />
        <VSwitch
          v-model="skipInviteInput"
          class="ml-1 mb-1"
          color="primary-darken-3"
          label="Skip invitation email"
          hide-details
          inset
        />
        <div class="text-caption text-medium-emphasis ml-1 mb-3">
          Useful for SSO users who don't need a password setup email.
          You can always send the invite later using Reinvite.
        </div>
        <div class="d-flex justify-end pb-2">
          <VBtn
            :disabled="isSaving"
            class="mr-2"
            color="primary-darken-4"
            variant="text"
            @click="close"
          >
            Cancel
          </VBtn>
          <VBtn
            :disabled="isSaving"
            color="primary-darken-4"
            type="submit"
            variant="tonal"
          >
            Add
          </VBtn>
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { array, boolean, object, string } from 'yup';
import { map, throttle } from 'lodash-es';
import { TailorDialog } from '@tailor-cms/core-components';
import { titleCase } from '@tailor-cms/utils';
import { useForm } from 'vee-validate';
import type { User } from '@tailor-cms/interfaces/user';
import { UserRole } from '@tailor-cms/common';

import { user as userApi, userGroup as userGroupApi } from '@/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Role {
  title: string;
  value: string;
}

const props = defineProps<{
  userGroupId: number;
}>();

const emit = defineEmits(['save']);

const authStore = useAuthStore();

const emailInputEl = useTemplateRef('emailInputEl');
const isVisible = ref(false);
const isSaving = ref(false);
const suggestedUsers = ref([]);

const roles = computed<Role[]>(() =>
  map([UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR], (value) => ({
    title: titleCase(value),
    value,
  })),
);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  initialValues: {
    email: [],
    role: UserRole.USER,
    skipInvite: false,
  },
  validationSchema: computed(() =>
    object({
      email: array()
        .of(string().email('Invalid email address'))
        .min(1, 'At least one email is required'),
      role: string().required(),
      skipInvite: boolean(),
    }),
  ),
});

const [emailInput] = defineField('email');
const [roleInput] = defineField('role');
const [skipInviteInput] = defineField('skipInvite');

const onEmailValueChange = (val: string[]) =>
  (emailInput.value = val.filter((v: string) => EMAIL_PATTERN.test(v)));

const onEmailInputFocusChange = (isFocused: boolean) => {
  if (isFocused) return;
  const searchValue = emailInputEl.value.search;
  const isValidEmail = EMAIL_PATTERN.test(searchValue);
  const isEmailAlreadyAdded = emailInput.value.find(
    (v: string) => v === searchValue,
  );
  if (isValidEmail && !isEmailAlreadyAdded) {
    emailInput.value.push(searchValue);
  }
  emailInputEl.value.search = '';
};

const close = () => {
  isVisible.value = false;
  resetForm();
};

const submit = handleSubmit(async () => {
  isSaving.value = true;
  const payload = {
    emails: emailInput.value,
    role: roleInput.value,
    skipInvite: skipInviteInput.value,
  };
  await userGroupApi.upsertUser(props.userGroupId, payload);
  suggestedUsers.value = [];
  isSaving.value = false;
  emit('save', payload);
  close();
});

const fetchUsers = throttle(async (filter) => {
  // Only admins can see the list of users
  if (!authStore.isAdmin) return;
  if (!filter || filter.length < 2) {
    suggestedUsers.value = [];
    return;
  }
  const { items: users } = await userApi.fetch({ filter });
  suggestedUsers.value = users.map((it: User) => it.email);
}, 350);
</script>
