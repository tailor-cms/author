<template>
  <VCard class="d-flex align-center mb-1 pa-2" variant="tonal">
    <VTooltip location="bottom" open-delay="500">
      <template #activator="{ props: tooltipProps }">
        <span
          v-bind="tooltipProps"
          class="d-flex align-center text-body-2 text-uppercase font-weight-bold"
        >
          <VIcon color="lime" icon="mdi-link-variant" size="small" start />
          {{ isEntryPoint ? 'Linked' : 'Linked via parent' }}
        </span>
      </template>
      <template v-if="isEntryPoint">Linked content</template>
      <template v-else>
        Part of linked hierarchy via "{{ linkedParentName }}"
      </template>
    </VTooltip>
    <VTooltip v-if="isEntryPoint && sourceLabel" location="bottom">
      <template #activator="{ props: tooltipProps }">
        <span
          v-bind="tooltipProps"
          class="source-name pl-2 text-body-2 text-truncate"
        >
          {{ sourceLabel }}
        </span>
      </template>
      {{ sourceLabel }}
    </VTooltip>
    <VSpacer />
    <ActionsMenu
      :is-entry-point="isEntryPoint"
      @source:view="viewSource"
      @source:unlink="handleUnlink"
      @parent:navigate="goToLinkedParent"
    />
  </VCard>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityApi } from '@/api';

import ActionsMenu from './ActionsMenu.vue';

interface SourceInfo {
  id: number;
  repository: { id: number; name: string; schema: string };
}

const { $schemaService } = useNuxtApp() as any;
const store = useActivityStore();
const notify = useNotification();

const props = defineProps<{ activity: Activity }>();

const isEntryPoint = computed(() => store.isLinkEntryPoint(props.activity.id));
const source = ref<SourceInfo | null>(null);
const sourceLabel = computed(() => {
  const repo = source.value?.repository;
  if (!repo?.name) return '';
  const schemaName = repo.schema
    ? $schemaService.getSchema(repo.schema).name
    : '';
  const label = schemaName ? `${repo.name} ${schemaName}` : repo.name;
  return `from ${label}`;
});

const linkedParent = computed(() => {
  let current = store.getParent(props.activity.id);
  while (current) {
    if (current.isLinkedCopy) {
      const parent = store.getParent(current.id);
      if (!parent?.isLinkedCopy) return current;
    }
    current = store.getParent(current.id);
  }
  return null;
});

const linkedParentName = computed(
  () => linkedParent.value?.data?.name || 'parent',
);

const fetchSource = async () => {
  if (!props.activity.sourceId) return;
  const { repositoryId, id } = props.activity;
  try {
    source.value = await activityApi.getSource(repositoryId, id);
  } catch {
    source.value = null;
  }
};

const goToActivity = (repositoryId: number, activityId: number) => {
  navigateTo({
    name: 'repository',
    params: { id: repositoryId },
    query: { activityId },
  });
};

const viewSource = () => {
  if (!source.value?.repository) return;
  goToActivity(source.value.repository.id, source.value.id);
};

const goToLinkedParent = () => {
  if (!linkedParent.value) return;
  goToActivity(props.activity.repositoryId, linkedParent.value.id);
};

const handleUnlink = async () => {
  const { repositoryId, id } = props.activity;
  try {
    const unlinked = await activityApi.unlink(repositoryId, id);
    store.add(unlinked);
    notify('Activity unlinked', { immediate: true });
  } catch {
    notify('Failed to unlink activity', { color: 'error' });
  }
};

watch(() => props.activity.id, fetchSource, { immediate: true });
</script>

<style scoped>
.source-name {
  max-width: 17rem;
}
</style>
