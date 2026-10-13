<template>
  <div ref="navigationContainer" class="collection-navigation">
    <div class="controls px-3 pt-2">
      <div class="d-flex align-center ga-2">
        <VTextField
          v-model="search"
          class="flex-grow-1"
          clear-icon="mdi-close"
          placeholder="Search..."
          bg-color="surface-container"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          variant="solo"
          flat
          clearable
          hide-details
        />
        <VBtn
          v-tooltip:bottom="{ text: addLabel, openDelay: 500 }"
          :aria-label="addLabel"
          color="primary"
          icon="mdi-plus"
          size="x-small"
          variant="tonal"
          @click="showCreateDialog = true"
        />
      </div>
      <div class="d-flex align-center justify-space-between ga-2 mt-2">
        <EntityFilter
          v-if="hasMultipleEntities"
          v-model="selectedEntity"
          :entities="entities"
          rounded="lg"
          show-arrows="never"
        />
        <CollectionSortMenu v-model="sort" compact />
      </div>
    </div>
    <VList
      v-if="sortedItems.length"
      class="collection-nav-list"
      density="compact"
      nav
    >
      <VListItem
        v-for="item in sortedItems"
        :key="item.id"
        :class="{ 'text-primary font-weight-bold is-active': item.id === selected?.id }"
        :title="item.data.name"
        class="collection-nav-item text-truncate"
        color="primary"
        @click="navigateToActivity(item.id)"
      />
    </VList>
    <TailorEmptyState
      v-else-if="search"
      action-text="Clear search"
      prepend-action-icon="mdi-close"
      text="No items match your search."
      title="No matches"
      class="flex-grow-1"
      height="100%"
      icon="mdi-magnify"
      variant="text"
      @click:action="search = ''"
    />
    <TailorEmptyState
      v-else
      :action-text="addLabel"
      :icon="activeEntity?.icon"
      :title="`No ${activeEntity?.label ?? 'items'} yet`"
      prepend-action-icon="mdi-plus"
      text="Create the first one to get started."
      class="flex-grow-1"
      height="100%"
      variant="text"
      @click:action="showCreateDialog = true"
    />
    <CreateDialog
      v-if="showCreateDialog"
      :anchor="anchor"
      :default-type="selectedEntity"
      :repository-id="repository.id"
      open-in-editor
      @close="showCreateDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { last } from 'lodash-es';
import { storeToRefs } from 'pinia';

import CollectionSortMenu from '@/components/repository/Outline/CollectionSortMenu.vue';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';
import { TailorEmptyState } from '@tailor-cms/core-components';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  repository: Repository;
  selected: Activity | null;
}>();

const { $schemaService } = useNuxtApp() as any;
const { rootActivities } = storeToRefs(useCurrentRepository());
const { entities, hasMultipleEntities } = useCollectionEntities();

const search = ref('');
// Local filter state - unlike the structure page, switching the filter should
// only narrow the list, never select or navigate. It tracks whichever item is
// currently open so the chip reflects the edited item's type.
const selectedEntity = ref('');
watchEffect(() => {
  const openType = props.selected?.type;
  const isKnown = (type?: string) =>
    !!type && entities.value.some((it) => it.value === type);
  if (isKnown(openType)) selectedEntity.value = openType!;
  else if (!isKnown(selectedEntity.value)) {
    selectedEntity.value = entities.value[0]?.value ?? '';
  }
});

const { sort, sortedItems } = useCollectionList(search, selectedEntity);

// The active chip's option - its pluralized label and icon feed the
// entity-specific empty state.
const activeEntity = computed(() =>
  entities.value.find((it) => it.value === selectedEntity.value),
);

// Quick-create for the active entity type; saving navigates into the new item.
const showCreateDialog = ref(false);
// Same anchor as the structure page toolbar: append after the last root item.
const anchor = computed(() => last(rootActivities.value) ?? null);
const addLabel = computed(() => {
  const label = $schemaService.getLevel(selectedEntity.value)?.label ?? 'item';
  return `Add ${label}`;
});

const navigateToActivity = (activityId: number) => {
  if (activityId === props.selected?.id) return;
  navigateTo({
    name: 'editor',
    params: { id: props.repository.id, activityId },
  });
};

const navigationContainer = useTemplateRef<HTMLElement>('navigationContainer');
const scrollSelectedItemIntoView = async () => {
  await nextTick();
  const node =
    navigationContainer.value?.querySelector<HTMLElement>('.is-active');
  node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
onMounted(scrollSelectedItemIntoView);
watch(() => props.selected?.id, scrollSelectedItemIntoView);
</script>

<style lang="scss" scoped>
.collection-navigation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

// The header stays put; only the list scrolls, so its scrollbar starts
// below the controls rather than running the full panel height.
.controls {
  flex: 0 0 auto;
}

.collection-nav-list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}
</style>
