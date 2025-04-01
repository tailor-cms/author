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
          ref="emailInput"
          :model-value="emailInput"
          :items="suggestedUsers"
          :clear-on-select="false"
          :error-messages="errors.email"
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
          @update:model-value="(emails: string[]) => {
            emailInput = emails.filter((v: string) => EMAIL_PATTERN.test(v));
          }"
          @update:search="fetchUsers"
        />
        <VSelect
          v-model="roleInput"
          :error-messages="errors.role"
          :items="roles"
          aria-label="Role"
          class="group-role-select required my-4"
          label="Role"
          placeholder="Role..."
          variant="outlined"
        />
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
import { array, object, string } from 'yup';
import map from 'lodash/map';
import { TailorDialog } from '@tailor-cms/core-components';
import throttle from 'lodash/throttle';
import { title as titleCase } from 'to-case';
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

const isVisible = ref(false);
const isSaving = ref(false);
const suggestedUsers = ref([]);
const searchInput = ref('');

const emailInputEl = useTemplateRef('emailInput');

const roles = computed<Role[]>(() =>
  map([UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR], (value) => ({
    title: titleCase(value),
    value,
  })),
);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: computed(() =>
    object({
      email: array()
        .of(string().email('Invalid email address'))
        .min(1, 'At least one email is required'),
      role: string().required(),
    }),
  ),
});

const [emailInput] = defineField('email');
const [roleInput] = defineField('role');

const close = () => {
  isVisible.value = false;
  resetForm();
};

const onEmailInputFocusChange = (isFocused: boolean) => {
  if (isFocused) return;
  emailInputEl.value.search = '';
};

const submit = handleSubmit(async () => {
  isSaving.value = true;
  const payload = {
    emails: emailInput.value,
    role: roleInput.value,
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
