<template>
  <VLayout class="repository-access h-100">
    <VMain class="access-main">
      <VContainer class="access-content px-md-10 py-md-8" max-width="1400">
        <div
          class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4"
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
          <AddUserDialog v-if="isMembersView" :roles="roles" />
          <AddUserGroup v-else :user-groups="groups" />
        </div>
        <div class="d-flex align-center ga-3 mb-4">
          <VChipGroup v-model="selectedEntity" class="access-tabs" mandatory>
            <VChip
              v-for="tab in TABS"
              :key="tab.value"
              :text="tab.label"
              :value="tab.value"
              color="secondary"
              role="tab"
              rounded="pill"
              size="small"
              variant="tonal"
              filter
            />
          </VChipGroup>
          <VSpacer />
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
        </div>
        <AccessMembers
          v-if="isMembersView"
          :is-loading="isLoading"
          :search="search"
          :sort-order="sortOrder"
          @clear:search="search = ''"
        />
        <AccessGroups
          v-else
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

import AccessGroups from '@/components/repository/Access/AccessGroups.vue';
import AccessMembers from '@/components/repository/Access/AccessMembers.vue';
import AddUserDialog from '@/components/repository/Access/AddUserDialog.vue';
import AddUserGroup from '@/components/repository/Access/AddUserGroup.vue';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository-access',
});

const currentRepositoryStore = useCurrentRepository();
const { repository } = storeToRefs(currentRepositoryStore);

const roles = useRepositoryRoles();

const isLoading = ref(true);
const selectedEntity = ref('members');
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const groups = computed<UserGroup[]>(
  () => (repository.value?.userGroups as UserGroup[]) ?? [],
);

const TABS = [
  { label: 'Members', value: 'members' },
  { label: 'Groups', value: 'groups' },
];

const isMembersView = computed(() => selectedEntity.value === 'members');

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

// A search term is scoped to the visible list; drop it on switch.
watch(selectedEntity, () => {
  search.value = '';
});

onMounted(async () => {
  if (!currentRepositoryStore.access.canAccessSettings)
    return navigateTo({ name: 'catalog' });
  await currentRepositoryStore.getUsers();
  isLoading.value = false;
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
