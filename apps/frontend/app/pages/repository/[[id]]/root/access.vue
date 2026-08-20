<template>
  <VLayout class="repository-access h-100">
    <VMain class="access-main">
      <VContainer class="access-content px-md-10 py-md-8" max-width="1100">
        <VTabs
          class="access-tabs mb-6"
          density="compact"
          color="primary"
          hide-slider
        >
          <VTab
            :to="{ name: 'repository-access-members', params: { id } }"
            :variant="isMembersView ? 'tonal' : 'text'"
            prepend-icon="mdi-account"
            rounded="pill"
            text="Members"
          />
          <VTab
            :to="{ name: 'repository-access-groups', params: { id } }"
            :variant="isMembersView ? 'text' : 'tonal'"
            prepend-icon="mdi-account-group"
            rounded="pill"
            text="Groups"
          />
        </VTabs>
        <div
          class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6"
        >
          <VTextField
            v-model="search"
            :placeholder="searchPlaceholder"
            bg-color="surface-container"
            density="comfortable"
            max-width="384"
            min-width="220"
            prepend-inner-icon="mdi-magnify"
            rounded="pill"
            variant="solo-filled"
            clearable
            flat
            hide-details
            @click:clear="search = ''"
          />
          <div class="d-flex align-center ga-3">
            <VMenu location="bottom end">
              <template #activator="{ props: menuProps }">
                <VBtn
                  v-bind="menuProps"
                  :text="activeSortLabel"
                  append-icon="mdi-chevron-down"
                  class="sort-btn"
                  prepend-icon="mdi-sort-variant"
                  rounded="lg"
                  size="small"
                  variant="text"
                />
              </template>
              <VList density="compact" min-width="220" slim nav>
                <VListSubheader>Sort by</VListSubheader>
                <VListItem
                  v-for="option in SORT_OPTIONS"
                  :key="option.order"
                  :active="sortOrder === option.order"
                  :prepend-icon="
                    sortOrder === option.order ? 'mdi-check' : 'mdi-blank'
                  "
                  :title="option.title"
                  @click="sortOrder = option.order"
                />
              </VList>
            </VMenu>
            <AddUserDialog v-if="isMembersView" :roles="roles" />
            <AddUserGroup v-else :user-groups="groups" />
          </div>
        </div>
        <NuxtPage
          :search="search"
          :sort-order="sortOrder"
          @clear:search="search = ''"
        />
      </VContainer>
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import AddUserDialog from '@/components/repository/Access/AddUserDialog.vue';
import AddUserGroup from '@/components/repository/Access/AddUserGroup.vue';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository-access',
  redirect: { name: 'repository-access-members' },
});

const route = useRoute();

const currentRepositoryStore = useCurrentRepository();
const { repository } = storeToRefs(currentRepositoryStore);

const roles = useRepositoryRoles();

const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const id = computed(() => currentRepositoryStore.repositoryId);

const groups = computed<UserGroup[]>(
  () => (repository.value?.userGroups as UserGroup[]) ?? [],
);

const isMembersView = computed(
  () => route.name === 'repository-access-members',
);

const searchPlaceholder = computed(() =>
  isMembersView.value ? 'Search members...' : 'Search groups...',
);

const SORT_OPTIONS = [
  { order: 'asc', title: 'Name (A–Z)' },
  { order: 'desc', title: 'Name (Z–A)' },
] as const;

const activeSortLabel = computed(
  () => SORT_OPTIONS.find((it) => it.order === sortOrder.value)?.title ?? 'Sort',
);

watch(
  () => route.name,
  () => {
    search.value = '';
  },
);

onMounted(() => {
  if (!currentRepositoryStore.access.canAccessSettings)
    navigateTo({ name: 'catalog' });
});
</script>

<style lang="scss" scoped>
.access-main {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.access-content {
  text-align: left;
}

.sort-btn {
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }
}
</style>
