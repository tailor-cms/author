<template>
  <TailorDialog v-model="isVisible" header-icon="mdi-account" persistent>
    <template #activator="{ props: activatorProps }">
      <VBtn
        v-bind="activatorProps"
        aria-label="Add users to the group"
        color="primary"
        class="add-user"
        prepend-icon="mdi-plus"
        text=" Add user"
        variant="flat"
      />
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
          :items="GROUP_ROLES"
          :menu-props="{ maxWidth: 420 }"
          aria-label="Role"
          class="group-role-select required mt-4 mb-1"
          label="Role"
          placeholder="Role..."
          variant="outlined"
        >
          <template #item="{ item, props: itemProps }">
            <VListItem
              v-bind="itemProps"
              :subtitle="item.description"
              :prepend-icon="item.icon"
              lines="two"
            />
          </template>
        </VSelect>
        <VSwitch
          v-model="skipInviteInput"
          class="ml-1 mb-1"
          label="Skip invitation email"
          hide-details
        />
        <div class="text-body-small text-medium-emphasis ml-1 mb-3">
          Useful for SSO users who don't need a password setup email.
          You can always send the invite later using Reinvite.
        </div>
        <div class="d-flex justify-end pb-2 ga-2">
          <VBtn
            :disabled="isSaving"
            variant="text"
            text="Cancel"
            @click="close"
          />
          <VBtn
            :disabled="isSaving"
            color="primary"
            type="submit"
            text="Add"
          />
        </div>
      </form>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { array, boolean, object, string } from 'yup';
import { throttle } from 'lodash-es';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';
import type { User } from '@tailor-cms/interfaces/user';
import { UserRole } from '@tailor-cms/interfaces/role';

import { api } from '@/api';
import { GROUP_ROLES } from '@/utils/groupRoles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const props = defineProps<{
  userGroupId: number;
}>();

const emit = defineEmits(['save']);

const authStore = useAuthStore();

const emailInputEl = useTemplateRef('emailInputEl');
const isVisible = ref(false);
const isSaving = ref(false);
const suggestedUsers = ref<string[]>([]);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  initialValues: {
    email: [] as string[],
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
  if (isFocused || !emailInputEl.value) return;
  const searchValue = emailInputEl.value?.search ?? '';
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
  await api.userGroup.addUser({
    params: { id: props.userGroupId },
    body: payload,
  });
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
  const { items: users } = await api.user.list({ query: { filter } });
  suggestedUsers.value = users.map((it: User) => it.email);
}, 350);
</script>
