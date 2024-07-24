<template>
  <VSheet class="rounded-b-lg" color="primary-darken-2" min-height="300">
    <VRow class="ma-0 pa-2">
      <VCol cols="12" md="8" sm="7">
        <VSheet v-if="selectedRevision" color="primary-lighten-5" rounded="lg">
          <ContentElementWrapper
            :element="selectedRevision?.state as unknown as ContentElement"
            is-disabled
          />
        </VSheet>
      </VCol>
      <VCol cols="12" md="4" sm="5">
        <EntitySidebar
          ref="sidebar"
          :is-detached="isDetached"
          :loading="loading"
          :revisions="revisions"
          :selected="selectedRevision"
          @preview="previewRevision"
          @rollback="rollback"
        />
      </VCol>
    </VRow>
  </VSheet>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { ContentElement as ContentElementWrapper } from '@tailor-cms/core-components-next';
import find from 'lodash/find';
import first from 'lodash/first';
import get from 'lodash/get';
import { promiseTimeout } from '@vueuse/core';
import type { Revision } from '@tailor-cms/interfaces/revision';

import {
  contentElement as contentElementApi,
  revision as revisionApi,
} from '@/api';
import EntitySidebar from './EntitySidebar.vue';

interface Props {
  revision: Revision;
  isDetached?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDetached: false,
});

const sidebar = ref<HTMLElement>();
const revisions = ref<Revision[]>([]);
const loading = ref<Record<string, boolean>>({});
const resolvedRevisions = ref<Revision[]>([]);
const selectedRevision = ref<Revision>();

const repositoryId = computed(() => props.revision.repositoryId);

const getRevisions = async () => {
  const { entity, state } = props.revision;
  const params = { entity, entityId: state.id };
  const { items }: { items: Revision[] } = await revisionApi.fetch(
    repositoryId.value,
    params,
  );
  return items;
};

const previewRevision = async (revision: Revision) => {
  if (get(selectedRevision.value, 'id') === revision.id) return;
  const resolvedRevision = find(resolvedRevisions.value, { id: revision.id });
  if (resolvedRevision) return (selectedRevision.value = resolvedRevision);
  loading.value[revision.id] = true;
  selectedRevision.value = await revisionApi.get(
    repositoryId.value,
    revision.id,
  );
  await promiseTimeout(600);
  loading.value[revision.id] = false;
};

const rollback = async (revision: Revision) => {
  loading.value[revision.id] = true;
  const entity = { ...revision.state, paranoid: false } as any;
  const { id, repositoryId } = entity;
  await contentElementApi.patch(repositoryId, id, entity);
  const items = await getRevisions();
  const newRevision = first(items);
  if (newRevision) {
    revisions.value.unshift(newRevision);
    previewRevision(newRevision);
  }
  loading.value[revision.id] = false;
  if (sidebar.value) sidebar.value.scrollTop = 0;
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
