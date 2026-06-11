<template>
  <VCard class="linked-indicator d-flex align-center mb-1 pa-2" variant="tonal">
    <VChip
      v-tooltip:bottom="{
        text: isEntryPoint
          ? 'Linked content'
          : `Part of linked hierarchy via '${linkedParentName}'`,
        openDelay: 500,
      }"
      :text="isEntryPoint ? 'Linked' : 'Linked via parent'"
      density="compact"
      class="linked-status text-uppercase font-weight-bold pl-2 pr-0"
      variant="text"
    >
      <template #prepend>
        <VIcon color="tertiary" icon="mdi-link-box" start />
      </template>
    </VChip>
    <span
      v-if="isEntryPoint && sourceLabel"
      v-tooltip:bottom="{ text: sourceLabel, openDelay: 500 }"
      class="source-name pl-2 text-body-medium text-truncate"
    >
      {{ sourceLabel }}
    </span>
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
import type { Repository } from '@tailor-cms/interfaces/repository';
import { api } from '@/api';

import ActionsMenu from './ActionsMenu.vue';

interface SourceInfo {
  id: number;
  repository: Pick<Repository, 'id' | 'name' | 'schema'>;
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
  while (current?.isLinkedCopy) {
    const parent = store.getParent(current.id);
    if (!parent?.isLinkedCopy) return current;
    current = parent;
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
    const data = await api.activity.getSource({
      params: { repositoryId, activityId: id },
    });
    source.value = data as SourceInfo;
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
    const unlinked = await api.activity.unlink({
      params: { repositoryId, activityId: id },
    });
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
