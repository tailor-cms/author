<template>
  <VLayout class="members-page h-100">
    <VMain class="members-main">
      <VContainer class="members-content px-md-10 py-md-8" max-width="1400">
        <div class="d-flex align-center ga-3 mb-4">
          <VHover>
            <template #default="{ props: hoverProps }">
              <VTextField
                v-bind="hoverProps"
                v-model="search"
                bg-color="transparent"
                class="members-search"
                density="comfortable"
                min-width="220"
                placeholder="Search members..."
                prepend-inner-icon="mdi-magnify"
                rounded="xl"
                variant="solo-filled"
                clearable
                hide-details
                flat
                @click:clear="search = ''"
              />
            </template>
          </VHover>
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
          <AddUserDialog :roles="roles" />
        </div>
        <template v-if="!isLoading">
          <TailorEmptyState
            v-if="!users.length"
            icon="mdi-account-multiple-outline"
            text="No users assigned to this repository yet."
            title="No members"
          />
          <VDataIterator
            v-else
            v-model:page="page"
            :items="users"
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
                  :role="user.repositoryRole"
                  :roles="roles"
                  :subtitle="user.fullName ? user.email : ''"
                  :title="user.label"
                  @update:role="upsertUser(user.email, $event as RepositoryRole)"
                  @remove:member="remove(user)"
                />
              </VList>
            </template>
            <template #no-data>
              <TailorEmptyState
                icon="mdi-magnify"
                text="No members match your search."
                title="No matches"
              />
            </template>
            <template #footer="{ page: currentPage, pageCount, itemsCount }">
              <div
                v-if="itemsCount"
                class="d-flex align-center justify-space-between mt-2 px-1"
              >
                <span class="text-body-medium">
                  Showing {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}
                  –{{ Math.min(currentPage * ITEMS_PER_PAGE, itemsCount) }}
                  of {{ itemsCount }}
                </span>
                <VPagination
                  v-if="pageCount > 1"
                  v-model="page"
                  :length="pageCount"
                  :total-visible="7"
                  density="comfortable"
                  rounded
                />
              </div>
            </template>
          </VDataIterator>
        </template>
      </VContainer>
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import { map } from 'lodash-es';
import { role, type RepositoryRole } from '@tailor-cms/interfaces/role';
import { storeToRefs } from 'pinia';
import { TailorEmptyState } from '@tailor-cms/core-components';
import { titleCase } from '@tailor-cms/utils';

import AddUserDialog from
  '@/components/repository/Settings/UserManagement/AddUserDialog.vue';
import MemberRow from '@/components/common/MemberRow.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface Role {
  title: string;
  value: RepositoryRole;
  description?: string;
}

const ROLE_DESCRIPTIONS = {
  ADMIN: `Full access. Edit content, manage users and groups, publish, and
    delete the repository.`,
  AUTHOR: `Edit content and structure. Cannot manage access or delete the
    repository.`,
};

const ITEMS_PER_PAGE = 10;
const FILTER_KEYS = ['label', 'email'];

definePageMeta({
  name: 'repository-settings-members',
});

const store = useCurrentRepository();
const notify = useNotification();
const { users } = storeToRefs(store);

const isLoading = ref(true);
const page = ref(1);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const roles = computed<Role[]>(() =>
  map(role.repository, (value) => ({
    title: titleCase(value),
    value,
    description: ROLE_DESCRIPTIONS[value],
  })),
);

const sortIcon = computed(() => sortOrder.value === 'desc'
  ? 'mdi-sort-alphabetical-descending'
  : 'mdi-sort-alphabetical-ascending',
);

watch([search, sortOrder], () => {
  page.value = 1;
});

const upsertUser = async (email: string, newRole: RepositoryRole) => {
  await store.upsertUser(email, newRole);
  await notify('User updated');
};

const removeUser = async (userId: number) => {
  await store.removeUser(userId);
};

const remove = (user: { id: number; email: string }) => {
  const showConfirmationModal = useConfirmationDialog();
  showConfirmationModal({
    title: 'Remove user',
    color: 'error',
    message: `Are you sure you want to remove user "${user.email}" \
from this repository?`,
    action: () => removeUser(user.id),
  });
};

onMounted(async () => {
  await store.getUsers();
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
.members-main {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.members-content {
  text-align: left;
}

.members-search {
  max-width: 18rem;

  :deep(.v-field__outline) {
    display: none;
  }
}
</style>
