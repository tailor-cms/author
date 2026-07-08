<template>
  <div ref="navigationContainer" class="collection-navigation">
    <div class="controls px-3 pt-2">
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
    <VAlert
      v-else
      class="mx-4"
      icon="mdi-information-outline"
      text="No items found!"
      variant="tonal"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Repository } from '@tailor-cms/interfaces/repository';

import CollectionSortMenu from '@/components/repository/Outline/CollectionSortMenu.vue';
import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';

const props = defineProps<{
  repository: Repository;
  selected: Activity | null;
}>();

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
