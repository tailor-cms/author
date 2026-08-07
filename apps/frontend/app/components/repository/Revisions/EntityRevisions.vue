<template>
  <VSheet class="rounded-b-lg" color="surface-container" min-height="274">
    <VRow class="pa-4" density="comfortable">
      <VCol cols="12" md="8" sm="7">
        <VSheet v-if="selectedRevision" rounded="lg" theme="light" elevation="1">
          <ContentElementWrapper
            :element="selectedRevision?.state as unknown as ContentElement"
            is-disabled
          />
        </VSheet>
      </VCol>
      <VCol class="order-first order-sm-last" cols="12" md="4" sm="5">
        <EntitySidebar
          ref="sidebar"
          :is-detached="isDetached"
          :loading="loading"
          :revisions="restorableRevisions"
          :selected="selectedRevision"
          @preview="previewRevision"
          @rollback="rollback"
        />
      </VCol>
    </VRow>
  </VSheet>
</template>

<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { Revision } from '@tailor-cms/interfaces/revision';
import { find, first, get } from 'lodash-es';
import { ContentElement as ContentElementWrapper } from '@tailor-cms/core-components';
import { promiseTimeout } from '@vueuse/core';

import {
  getCeRestorePayload,
  getRestoreDisabledMsg,
  type RestorableRevision,
} from '@/lib/revision';
import { api } from '@/api';
import EntitySidebar from './EntitySidebar.vue';

interface Props {
  revision: Revision;
  isDetached?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDetached: false,
});

const sidebar = ref<ComponentPublicInstance>();
const revisions = ref<Revision[]>([]);
const loading = ref<Record<string, boolean>>({});
const resolvedRevisions = ref<Revision[]>([]);
const selectedRevision = ref<Revision>();

const { isAgentRunning } = useAgentRunState();

const repositoryId = computed(() => props.revision.repositoryId);

// The newest revision is the content element
const currentState = computed(() => first(revisions.value)?.state);

const restorableRevisions = computed<RestorableRevision[]>(() =>
  revisions.value.map((revision) => ({
    ...revision,
    restoreDisabledMsg: isAgentRunning.value
      ? 'Unavailable while Renoir is generating'
      : getRestoreDisabledMsg(revision, currentState.value),
  })),
);

const getRevisions = async () => {
  const { entity, state } = props.revision;
  const entityId = (state as { id: number }).id;
  const { items } = await api.revision.list({
    params: { repositoryId: repositoryId.value },
    query: { entity, entityId },
  });
  return items;
};

const previewRevision = async (revision: Revision) => {
  if (get(selectedRevision.value, 'id') === revision.id) return;
  const resolvedRevision = find(resolvedRevisions.value, { id: revision.id });
  if (resolvedRevision) return (selectedRevision.value = resolvedRevision);
  loading.value[revision.id] = true;
  selectedRevision.value = await api.revision.get({
    params: { repositoryId: repositoryId.value, revisionId: revision.id },
  });
  await promiseTimeout(600);
  loading.value[revision.id] = false;
};

const rollback = async (revision: Revision) => {
  if (isAgentRunning.value) return;
  const elementId = revision.state.id as number;
  loading.value[revision.id] = true;
  try {
    await api.contentElement.update({
      params: { repositoryId: repositoryId.value, elementId },
      body: getCeRestorePayload(revision.state),
    });
    revisions.value = await getRevisions();
    sidebar.value?.$el
      .querySelector('.changes-list')
      ?.scrollTo({ top: 0, behavior: 'smooth' });
    const restored = first(revisions.value);
    if (restored) await previewRevision(restored);
  } finally {
    loading.value[revision.id] = false;
  }
};

onMounted(async () => {
  revisions.value = await getRevisions();
  return previewRevision(props.revision);
});
</script>

<style lang="scss" scoped>
:deep(.frame) {
  border: none;
}
</style>
