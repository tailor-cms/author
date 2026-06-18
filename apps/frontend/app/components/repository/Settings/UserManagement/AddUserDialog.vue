<template>
  <TailorDialog
    v-model="isVisible"
    header-icon="mdi-account"
    title="Add user"
    persistent
    @submit="submit"
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        aria-label="Add user"
        class="add-user"
        color="primary"
        prepend-icon="mdi-plus"
        text="Add user"
        variant="flat"
      />
    </template>
    <template #body>
      <VCombobox
        v-model="emailInput"
        :error-messages="errors.email"
        :items="suggestedUsers"
        class="required mb-4"
        item-title="email"
        item-value="email"
        label="Email"
        placeholder="Enter email..."
        variant="outlined"
        @update:search="fetchUsers"
      />
      <VSelect
        v-model="roleInput"
        :error-messages="errors.role"
        :items="roles"
        aria-label="Role"
        class="role-select required my-4"
        label="Role"
        placeholder="Role..."
        variant="outlined"
      />
    </template>
    <template #actions>
      <VBtn
        :disabled="isSaving"
        text="Cancel"
        variant="text"
        @click="close"
      />
      <VBtn
        :disabled="isSaving"
        color="primary"
        text="Add"
        type="submit"
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { TailorDialog } from '@tailor-cms/core-components';
import { throttle } from 'lodash-es';
import { useForm } from 'vee-validate';
import type { RepositoryRole } from '@tailor-cms/interfaces/role';
import type { User } from '@tailor-cms/interfaces/user';

import { api } from '@/api';

defineProps<{
  roles: Array<{ title: string; value: RepositoryRole }>;
}>();

const authStore = useAuthStore();
const repositoryStore = useCurrentRepository();

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: computed(() =>
    object({
      email: string()
        .required()
        .email()
        .notOneOf(
          repositoryStore.users.map((user) => user.email),
          'User with that email is already added',
        ),
      role: string().required(),
    }),
  ),
});

const [emailInput] = defineField('email');
const [roleInput] = defineField('role');

const isVisible = ref(false);
const isSaving = ref(false);
const suggestedUsers = ref<string[]>([]);

const close = () => {
  isVisible.value = false;
  resetForm();
};

const submit = handleSubmit(async () => {
  isSaving.value = true;
  await repositoryStore.upsertUser(emailInput.value, roleInput.value);
  suggestedUsers.value = [];
  isSaving.value = false;
  close();
});

const fetchUsers = throttle(async (filter) => {
  // Only admins can see the list of users
  if (!authStore.isAdmin) return;
  if (!filter || filter.length < 2) {
    suggestedUsers.value = [];
    return;
  }
  const { items: users } = await api.user.list({ query: { filter } });
  suggestedUsers.value = users.map((it: User) => it.email);
}, 350);
</script>
