<template>
  <VSheet color="primary-lighten-4" min-height="300">
    <VRow class="ma-0 pa-2">
      <VCol cols="8">
        <VSheet color="primary-lighten-5" rounded="lg">
          <ContentElement
            v-if="selectedRevision?.resolved"
            :element="selectedRevision?.state"
            is-disabled
          />
        </VSheet>
      </VCol>
      <VCol cols="4">
        <EntitySidebar
          ref="sidebar"
          :is-detached="isDetached"
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
import { ContentElement } from '@tailor-cms/core-components-next';
import first from 'lodash/first';
import get from 'lodash/get';
import includes from 'lodash/includes';
import type { Revision } from '@tailor-cms/interfaces/revision';

import {
  contentElement as contentElementApi,
  revision as revisionApi,
} from '@/api';
import EntitySidebar from './EntitySidebar.vue';

const WITHOUT_STATICS = ['CE_HTML_DEFAULT'];

interface Props {
  revision: Revision;
  isDetached?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDetached: false,
});

const sidebar = ref<HTMLElement>();
const revisions = ref<Revision[]>([]);
const selectedRevision = ref<Revision>();

const repositoryId = computed(() => props.revision.repositoryId);

const getRevisions = async () => {
  const { entity, state } = props.revision;
  const params = { entity, entityId: state.id };
  const { items } = await revisionApi.fetch(repositoryId.value, params);
  return items.map((it: any) => {
    const resolved = includes(WITHOUT_STATICS, it.state.type);
    return Object.assign(it, { resolved });
  });
};

const previewRevision = async (revision: any) => {
  if (get(selectedRevision.value, 'id') === revision.id) return;
  if (!revision.resolved) {
    revision.loading = true;
    const { state } = await revisionApi.get(repositoryId.value, revision.id);
    Object.assign(revision, { state, resolved: true, loading: false });
  }
  selectedRevision.value = revision;
};

const rollback = async (revision: any) => {
  revision.loading = true;
  const entity = { ...revision.state, paranoid: false };
  const { id, repositoryId } = entity;
  await contentElementApi.patch(repositoryId, id, entity);
  const items = await getRevisions();
  const newRevision = first(items);
  revisions.value.unshift(newRevision);
  await previewRevision(newRevision);
  revision.loading = false;
  if (sidebar.value) sidebar.value.scrollTop = 0;
};

onMounted(async () => {
  await getRevisions().then((it) => (revisions.value = it));
  return previewRevision(props.revision);
});
</script>
