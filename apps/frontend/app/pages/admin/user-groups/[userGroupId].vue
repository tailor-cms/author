<template>
  <div class="user-group-users">
    <h1 class="d-sr-only">{{ userGroup?.name }}</h1>
    <template v-if="!isLoading">
      <div class="d-flex align-center ga-3 mb-4">
        <VTextField
          v-model="search"
          bg-color="transparent"
          class="member-search"
          density="comfortable"
          placeholder="Search members..."
          prepend-inner-icon="mdi-magnify"
          rounded="xl"
          variant="solo-filled"
          clearable
          flat
          hide-details
        />
        <VBtn
          v-tooltip:top="{
            text: sortOrder === 'desc' ? 'Name (Z–A)' : 'Name (A–Z)',
            openDelay: 500,
          }"
          :icon="sortIcon"
          aria-label="Toggle sort order"
          class="text-medium-emphasis"
          size="small"
          variant="text"
          @click="toggleSort"
        />
        <VSpacer />
        <UserGroupMembershipDialog
          :user-group-id="userGroupId"
          @save="onMembersChanged"
        />
      </div>
      <VDataIterator
        v-model:page="page"
        :items="userGroupUsers"
        :items-per-page="ITEMS_PER_PAGE"
        :search="search"
        :filter-keys="FILTER_KEYS"
        :sort-by="[{ key: 'label', order: sortOrder }]"
      >
        <template #default="{ items }">
          <VList
            bg-color="transparent"
            class="member-list pa-0 overflow-visible"
          >
            <MemberRow
              v-for="{ raw: user } in items"
              :key="user.id"
              :img-url="user.imgUrl"
              :role="user.userGroupMember.role"
              :roles="roles"
              :subtitle="user.fullName ? user.email : ''"
              :title="user.label"
              @update:role="upsertUser(user.email, $event)"
              @remove:member="removeUser(user.id)"
            />
          </VList>
        </template>
        <template #no-data>
          <TailorEmptyState v-bind="emptyState" @click:action="search = ''" />
        </template>
        <template #footer="{ pageCount, itemsCount }">
          <PaginationFooter
            v-model:page="page"
            :page-count="pageCount"
            :items-count="itemsCount"
            :items-per-page="ITEMS_PER_PAGE"
          />
        </template>
      </VDataIterator>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type {
  UserGroup,
  UserGroupMemberWithUser,
} from '@tailor-cms/interfaces/user-group';

import { TailorEmptyState } from '@tailor-cms/core-components';

import { api } from '@/api';
import MemberRow from '@/components/common/MemberRow.vue';
import PaginationFooter from '@/components/common/PaginationFooter.vue';
import UserGroupMembershipDialog from '~/components/admin/UserGroupMembershipDialog.vue';

definePageMeta({
  name: 'user-group',
});

const route = useRoute();
const auth = useAuthStore();
const userGroupList = useUserGroupList();
const notify = useNotification();
const notifyError = (message: string) => notify(message, { color: 'error' });

const isLoading = ref(true);
const userGroupId = parseInt(route.params.userGroupId as string, 10);
const userGroup = ref<UserGroup | null>(null);
const userGroupUsers = ref<UserGroupMemberWithUser[]>([]);

useHead({ title: () => userGroup.value?.name ?? 'User group' });

const roles = GROUP_ROLES;

const ITEMS_PER_PAGE = 10;
const FILTER_KEYS = ['label', 'email'];
const page = ref(1);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortIcon = computed(() => sortOrder.value === 'desc'
  ? 'mdi-sort-alphabetical-descending'
  : 'mdi-sort-alphabetical-ascending',
);

const emptyState = computed(() => search.value
  ? {
      actionText: 'Clear search',
      prependActionIcon: 'mdi-close',
      icon: 'mdi-magnify',
      text: 'No members match your search.',
      title: 'No matches',
    }
  : {
      icon: 'mdi-account-multiple-outline',
      text: 'No users assigned to this group yet.',
      title: 'No members',
    },
);

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

watch([search, sortOrder], () => {
  page.value = 1;
});

async function fetchUsers() {
  userGroupUsers.value = await api.userGroup.getUsers({
    params: { id: userGroupId },
  });
}

// Member changes move the counts shown in the group list too
const onMembersChanged = () =>
  Promise.all([fetchUsers(), userGroupList.refresh()]);

async function upsertUser(email: string, role: string) {
  try {
    const { failed } = await api.userGroup.addUser({
      params: { id: userGroupId },
      body: { emails: [email], role } as any,
    });
    await onMembersChanged();
    // A per-email failure comes back in `failed` (200), not as a throw;
    // funnel it into the same error notice
    if (failed.length) throw new Error('Role update failed');
    notify('User updated');
  } catch {
    notifyError('We couldn\'t update the user\'s role.');
  }
}

async function removeUser(userId: number) {
  const showDialog = useConfirmationDialog();
  const willLoseAccess = userId === auth.user?.id && !auth.isAdmin;
  const hasOtherAdminGroups = auth.groupsWithAdminAccess.length > 1;
  const confirmation = {
    title: willLoseAccess ? 'Remove yourself' : 'Remove user',
    color: 'error',
    message: willLoseAccess
      ? `You are about to remove yourself from this group and will lose access
        to it. Are you sure?`
      : 'Are you sure you want to remove user from a group?',
    action: async () => {
      await api.userGroup.removeUser({
        params: { id: userGroupId, userId },
      });
      if (willLoseAccess) {
        notify('You removed yourself from the group.');
        await userGroupList.refresh();
        if (hasOtherAdminGroups) return navigateTo({ name: 'user-groups' });
        await auth.fetchUserInfo();
        return navigateTo('/');
      }
      await onMembersChanged();
      notify('User removed');
    },
  };
  showDialog(confirmation);
}

onBeforeMount(async () => {
  try {
    userGroup.value = await api.userGroup.get({
      params: { id: userGroupId },
    });
  } catch (error) {
    // 403 when the acting user isn't an admin of this group
    const status = (error as any)?.response?.status;
    notifyError(
      status === 403
        ? 'You do not have access to this user group.'
        : 'We could not load this user group.',
    );
    return navigateTo({ name: 'user-groups' });
  }
  await fetchUsers();
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
.member-search {
  max-width: 18rem;

  :deep(.v-field__outline) {
    display: none;
  }
}
</style>
