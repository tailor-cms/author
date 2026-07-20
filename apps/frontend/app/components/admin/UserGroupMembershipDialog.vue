<template>
  <TailorDialog
    v-model="isVisible"
    header-icon="mdi-account"
    title="Add users to the user group"
    persistent
    @submit="submit"
  >
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
    <template #body>
      <VCombobox
        ref="emailInputEl"
        v-model="emailInput"
        :error-messages="errors.email"
        :items="suggestedUsers"
        class="email-combobox required mb-4"
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
    </template>
    <template #actions>
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
        variant="flat"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';
import type { UpsertMembersResult } from '@tailor-cms/api-client';
import { array, boolean, object, string } from 'yup';
import { throttle } from 'lodash-es';
import { TailorDialog } from '@tailor-cms/core-components';
import { useForm } from 'vee-validate';
import { UserRole } from '@tailor-cms/interfaces/role';

import { api } from '@/api';
import { GROUP_ROLES } from '@/utils/groupRoles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const props = defineProps<{
  userGroupId: number;
}>();

const emit = defineEmits(['save']);

const authStore = useAuthStore();
const notify = useNotification();

const pluralize = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;

const buildNotification = ({
  created,
  updated,
  skipped,
  failed,
}: UpsertMembersResult) => {
  const hasSuccess = created > 0 || updated > 0;
  const hasFailures = failed.length > 0;
  // Clean no-op: everyone was already a member and nothing failed.
  if (!hasSuccess && !hasFailures && skipped) {
    const message =
      skipped === 1
        ? 'User is already a member of this group'
        : 'All selected users are already members of this group';
    return { message, color: undefined as string | undefined };
  }
  const parts = [];
  if (created) parts.push(`${pluralize(created, 'user')} added`);
  if (updated) parts.push(`${pluralize(updated, 'role')} updated`);
  if (skipped) {
    parts.push(`${skipped} already ${skipped === 1 ? 'a member' : 'members'}`);
  }
  if (hasFailures) {
    parts.push(`${pluralize(failed.length, 'email')} failed: ${failed.join(', ')}`);
  }
  const message = parts.length ? parts.join(', ') : 'No changes made';
  let color: string | undefined;
  if (hasFailures) color = hasSuccess ? 'warning' : 'error';
  return { message, color };
};

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
  try {
    const summary = await api.userGroup.addUser({
      params: { id: props.userGroupId },
      body: payload,
    });
    const { message, color } = buildNotification(summary);
    notify(message, { color });
    suggestedUsers.value = [];
    emit('save', payload);
    close();
  } catch {
    notify('We couldn\'t add the users. Please try again.', { color: 'error' });
  } finally {
    isSaving.value = false;
  }
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

<style lang="scss" scoped>
// Keep the typed email on its own full-width line
.email-combobox :deep(.v-field__input) input {
  min-width: 100%;
}
</style>
