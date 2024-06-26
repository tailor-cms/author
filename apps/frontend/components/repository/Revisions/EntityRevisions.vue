<template>
  <transition name="slide-fade">
    <div class="revisions">
      <div class="preview">
        <VSheet color="primary-lighten-5" rounded="lg">
          <ContentElement
            v-if="selectedRevision?.resolved"
            :element="selectedRevision?.state"
            is-disabled
          />
        </VSheet>
      </div>
      <EntitySidebar
        v-show="expanded"
        ref="sidebar"
        :is-detached="isDetached"
        :revisions="revisions"
        :selected="selectedRevision"
        @preview="previewRevision"
        @rollback="rollback"
      />
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { ContentElement } from '@tailor-cms/core-components-next';
import first from 'lodash/first';
import get from 'lodash/get';
import includes from 'lodash/includes';
import pick from 'lodash/pick';
import Promise from 'bluebird';
import type { Revision } from '@tailor-cms/interfaces/revision';

import {
  contentElement as contentElementApi,
  revision as revisionApi,
} from '@/api';
import EntitySidebar from './EntitySidebar.vue';

const WITHOUT_STATICS = [
  'JODIT_HTML',
  'BRIGHTCOVE_VIDEO',
  'EMBED',
  'BREAK',
  'HTML',
];

interface Props {
  revision: Revision;
  isDetached?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDetached: false,
});

const expanded = ref(false);
const revisions = ref<Revision[]>([]);
const selectedRevision = ref<Revision>();

const repositoryId = computed(() => props.revision.repositoryId);

const getRevisions = () => {
  const { entity, state } = props.revision;
  const params = { entity, entityId: state.id };
  return revisionApi.fetch(repositoryId.value, params).then(({ items }) => {
    items.forEach((it: any) => {
      if (includes(WITHOUT_STATICS, it.state.type)) it.resolved = true;
    });
    return items;
  });
};

const previewRevision = (revision: any) => {
  if (get(selectedRevision.value, 'id') === revision.id) return;
  selectedRevision.value = revision;
  if (revision.resolved) return;
  revision.loading = true;
  return revisionApi
    .get(repositoryId.value, revision.id)
    .then((data) => {
      Object.assign(revision, { state: data.state, resolved: true });
      selectedRevision.value = revision;
      return Promise.delay(600);
    })
    .then(() => {
      revision.loading = false;
    });
};

const rollback = (revision: any) => {
  revision.loading = true;
  const entity = { ...revision.state, paranoid: false };
  const options = pick(entity, ['id', 'repositoryId']);
  return contentElementApi
    .patch(options, entity)
    .then(getRevisions)
    .then((revisions) => {
      const newRevision = first(revisions);
      revisions.unshift(newRevision);
      previewRevision(newRevision);
      return Promise.delay(300);
    })
    .then(() => {
      revision.loading = false;
      $refs.sidebar.scrollTop();
    });
};

onMounted(async () => {
  getRevisions().then((it) => (revisions.value = it));
  previewRevision(props.revision);
  Promise.delay(700).then(() => {
    expanded.value = true;
  });
});
</script>

<style lang="scss" scoped>
.revisions {
  display: flex;
  padding: 32px 8px;

  .preview {
    margin-right: 16px;
    min-width: 300px;
    min-height: 500px;
    text-align: center;
    flex-grow: 1;

    :deep(.frame) {
      border: none !important;
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  overflow: hidden;
  transition: all 350ms cubic-bezier(0.165, 0.84, 0.44, 1);
  margin-top: 0;
  margin-bottom: 0;
}

.slide-fade-enter,
.slide-fade-leave-to {
  height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
