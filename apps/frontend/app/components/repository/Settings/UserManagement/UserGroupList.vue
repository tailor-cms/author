<template>
  <VAlert
    v-if="groups.length === 0"
    class="ma-6"
    color="primary-lighten-3"
    icon="mdi-information-outline"
    variant="tonal"
  >
    No associated user groups.
  </VAlert>
  <VList v-else bg-color="transparent" class="group-list pa-0">
    <VListItem
      v-for="group in paginatedGroups"
      :key="group.id"
      :to="{ name: 'user-group', params: { userGroupId: group.id } }"
      class="group-row py-3 px-4 mb-2"
      rounded="lg"
    >
      <template #prepend>
        <UserGroupAvatar :logo-url="group.logoUrl" :size="34" />
      </template>
      <VListItemTitle class="text-body-1 font-weight-medium">
        {{ group.name }}
      </VListItemTitle>
      <template #append>
        <VBtn
          aria-label="Deassociate user group"
          color="white"
          icon="mdi-delete-outline"
          size="small"
          variant="text"
          @click.stop.prevent="remove(group)"
        />
      </template>
    </VListItem>
    <VPagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      :total-visible="7"
      active-color="primary-lighten-4"
      class="pt-2"
      color="primary-lighten-3"
      density="comfortable"
      rounded
    />
  </VList>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import api from '@/api/repository.js';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

const ITEMS_PER_PAGE = 10;

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const groups = computed(
  () => currentRepositoryStore?.repository?.userGroups || [],
);

const page = ref(1);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(groups.value.length / ITEMS_PER_PAGE)),
);

const paginatedGroups = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE;
  return groups.value.slice(start, start + ITEMS_PER_PAGE);
});

const remove = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  const { repositoryId } = currentRepositoryStore;
  const payload = {
    repositoryId,
    userGroupId: group.id,
  };
  const confirmation = {
    title: 'Remove from user group?',
    message: `Are you sure you want to remove "${group.name}" user group?`,
    action: () =>
      api
        .removeUserGroup(payload)
        .then(() => repositoryStore.get(repositoryId as number)),
  };
  showDialog(confirmation);
};

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});
</script>

<style lang="scss" scoped>
.group-list {
  background: transparent;
  text-align: left;
}

.group-row {
  background: rgba(var(--v-theme-primary-darken-2));
}
</style>
