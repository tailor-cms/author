<template>
  <div class="subactivity-list d-flex flex-column ga-3">
    <template v-if="children.length">
      <div class="d-flex align-center ga-2">
        <VIcon icon="mdi-format-list-bulleted-square" size="small" />
        <span class="text-title-small font-weight-bold">Contents</span>
      </div>
      <VList
        bg-color="transparent"
        class="d-flex flex-column ga-2"
        lines="two"
      >
        <VListItem
          v-for="child in children"
          :key="child.id"
          :style="{ '--type-accent': getColor(child.type) }"
          :subtitle="getLabel(child.type)"
          :title="getName(child)"
          :to="routeFor(child)"
          class="subactivity-list__row"
          color="primary"
          rounded="lg"
        >
          <template #append>
            <VIcon icon="mdi-chevron-right" />
          </template>
        </VListItem>
      </VList>
    </template>
    <VAlert v-else icon="mdi-information-outline" variant="tonal" prominent>
      This {{ activityLabel.toLowerCase() }} has no content yet.
    </VAlert>
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{ activity: Activity }>();

const { $schemaService, $pluginRegistry } = useNuxtApp() as any;
const repositoryStore = useCurrentRepository();

const activityLabel = computed(
  () => $schemaService.getLevel(props.activity.type)?.label || 'Activity',
);

const children = computed(() =>
  activityUtils
    .getChildren(repositoryStore.activities, props.activity.id)
    .filter((it: Activity) => !it.deletedAt),
);

const getLabel = (type: string) => $schemaService.getLevel(type)?.label;
const getColor = (type: string) => $schemaService.getLevel(type)?.color;
const getName = (activity: Activity) => {
  const data = activity.data;
  const raw = data?.name ?? '';
  return $pluginRegistry.filter('data:value', raw, { data, key: 'name' });
};

const routeFor = (activity: Activity) => ({
  name: 'editor',
  params: {
    id: repositoryStore.repositoryId,
    activityId: activity.id,
  },
});
</script>

<style lang="scss" scoped>
.subactivity-list {
  margin: auto;

  &__row {
    border: thin solid rgb(var(--v-theme-outline-variant));
    border-left: 4px solid var(--type-accent);
    transition: border-color 0.15s ease;

    &:hover {
      border-color: rgb(var(--v-theme-primary));
      border-left-color: var(--type-accent);
    }
  }
}
</style>
