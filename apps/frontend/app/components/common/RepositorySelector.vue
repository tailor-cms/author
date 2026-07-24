<template>
  <VMenu
    v-model="isOpen"
    :close-on-content-click="false"
    location="bottom start"
    offset="8"
    width="340"
    transition="slide-y-transition"
  >
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        class="repository-selector px-3"
        variant="text"
        rounded="lg"
        height="32"
        active
      >
        <span class="text-truncate text-body-medium font-weight-medium mr-1">
          {{ repository.name }}
        </span>
        <VIcon class="mr-n1" icon="mdi-menu-down" size="small" />
      </VBtn>
    </template>
    <VCard color="surface-raised">
      <VListSubheader class="text-label-medium mx-4">Switch repository</VListSubheader>
      <VTextField
        v-model="search"
        bg-color="surface-container-high"
        class="ma-2 mt-0"
        placeholder="Search repositories…"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        density="compact"
        rounded="md"
        flat
        hide-details
        clearable
        autofocus
      />
      <VDivider />
      <div class="position-relative">
        <VProgressLinear
          v-if="isLoaderVisible"
          absolute
          indeterminate
          color="primary"
        />
        <VList
          v-if="repositories.length"
          class="repository-list"
          density="compact"
          max-height="400"
          nav
        >
          <VListItem
            v-for="item in repositories"
            :key="item.id"
            :active="item.id === repository.id"
            :title="item.name"
            @click="selectRepository(item.id)"
          >
            <template #prepend>
              <VIcon :icon="repositoryIcon(item.id)" size="small" />
            </template>
            <template v-if="isRemovableRecent(item.id)" #append>
              <VBtn
                :aria-label="`Remove ${item.name} from recents`"
                class="remove-recent"
                icon="mdi-close"
                size="x-small"
                variant="text"
                density="comfortable"
                @click.stop="removeRecent(item.id)"
              />
            </template>
          </VListItem>
        </VList>
        <div
          v-if="hasQuery && hasLoaded && !repositories.length"
          class="text-medium-emphasis text-label-large pa-5 text-center"
        >
          No repositories found
        </div>
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { Repository } from '@tailor-cms/interfaces/repository';
import { refDebounced } from '@vueuse/core';
import { sortBy, take, without } from 'lodash-es';

import { useRepositorySwitcher } from '@/composables/useRepositorySwitcher';

const RECENT_LIMIT = 8;

const props = defineProps<{ repository: Repository }>();

const {
  search,
  items,
  recentItems,
  isLoading,
  hasLoaded,
  fetchRecent,
  removeRecent,
} = useRepositorySwitcher();
const recentRepositories = useRecentRepositories();

const hasQuery = computed(() => !!search.value);

// A row is a removable recent only in the default view: never the pinned
// current repository, and never a search result.
const isRemovableRecent = (id: number) =>
  !hasQuery.value &&
  id !== props.repository.id &&
  recentRepositories.ids.value.includes(id);

// The current repository is excluded; it renders from the prop, pinned first.
const recentIds = computed(() => {
  const ids = without(recentRepositories.ids.value, props.repository.id);
  return take(ids, RECENT_LIMIT - 1);
});

// Current repository first, then visited matches by recency; the stable
// sort keeps the server's name order for the rest.
const rankedMatches = computed(() => {
  const recency = new Map(recentRepositories.ids.value.map((id, i) => [id, i]));
  return sortBy(items.value, [
    (it) => it.id !== props.repository.id,
    (it) => recency.get(it.id) ?? Infinity,
  ]);
});

// The default view stays up until the first search response lands, so
// the list is never blanked mid-fetch.
const repositories = computed(() =>
  hasQuery.value && hasLoaded.value
    ? rankedMatches.value
    : [props.repository, ...recentItems.value],
);

const repositoryIcon = (id: number) => {
  if (id === props.repository.id) return 'mdi-check';
  return recentRepositories.ids.value.includes(id) ? 'mdi-history' : '';
};

// Delay the loader so fast responses don't flash it over the results.
const delayedLoading = refDebounced(isLoading, 200);
const isLoaderVisible = computed(
  () => isLoading.value && delayedLoading.value,
);

const isOpen = ref(false);

const selectRepository = (id: number) => {
  isOpen.value = false;
  if (id === props.repository.id) return;
  navigateTo({ name: 'repository', params: { id } });
};

// Reset on close so reopening starts from recents, not a stale search.
watch(isOpen, (open) => {
  if (open) fetchRecent(recentIds.value);
  else search.value = '';
});
</script>

<style lang="scss" scoped>
// Reveal the remove control on hover/focus only; keep it visible on touch
// where there is no hover. Opacity (not v-if) so the row never reflows.
.remove-recent {
  opacity: 0;
  transition: opacity 0.15s ease;

  .v-list-item:hover &,
  .v-list-item:focus-within & {
    opacity: 1;
  }
}

@media (hover: none) {
  .remove-recent {
    opacity: 1;
  }
}

.repository-list :deep(.v-list-item-title) {
  white-space: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.repository-selector {
  max-width: 21.25rem;

  // Let the grid content area shrink so the name can truncate.
  :deep(.v-btn__content) {
    min-width: 0;
  }
}
</style>
