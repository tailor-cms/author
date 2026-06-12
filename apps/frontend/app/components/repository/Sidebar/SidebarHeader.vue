<template>
  <div class="header mt-4">
    <div class="options-container">
      <ActivityOptions
        v-if="!isSoftDeleted"
        :activity="props.activity"
        class="float-right"
      />
    </div>
    <VBtn
      v-show="!isSoftDeleted && isEditable"
      class="px-4 mr-3 btn-open"
      prepend-icon="mdi-page-next-outline"
      size="small"
      text="Open"
      variant="tonal"
      @click.stop="edit"
    />
    <VBtn
      v-if="isSoftDeleted"
      class="mr-3"
      prepend-icon="mdi-history"
      size="small"
      text="Restore"
      variant="tonal"
      @click.stop="restore"
    />
    <ActivityPublishing
      v-if="store.repository?.hasAdminAccess"
      :activity="activity"
      :is-soft-deleted="isSoftDeleted"
      :outline-activities="store.outlineActivities"
    />
  </div>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { get } from 'lodash-es';

import ActivityPublishing from './ActivityPublishing.vue';
import ActivityOptions from '@/components/common/ActivityOptions/ActivityMenu.vue';
import { api } from '@/api';
import { useCurrentRepository } from '@/stores/current-repository';
import { useActivityStore } from '@/stores/activity';

const props = defineProps<{ activity: StoreActivity }>();

const { $schemaService } = useNuxtApp() as any;
const activityStore = useActivityStore();
const store = useCurrentRepository();

const isEditable = computed(() => {
  const type = get(props.activity, 'type');
  return type && $schemaService.isEditable(type);
});

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const edit = () => {
  if (!isEditable?.value) return;
  const { repositoryId, id: activityId } = props.activity;
  navigateTo({
    name: 'editor',
    params: { repositoryId, activityId },
  });
};

const restore = async () => {
  const { id: activityId, repositoryId } = props.activity;
  await api.activity.restore({ params: { repositoryId, activityId } });
  return activityStore.fetch(repositoryId, { outlineOnly: true });
};
</script>

<style lang="scss" scoped>
.options-container {
  min-height: 1.5rem;
}

.btn-open {
  margin-right: 0.5rem;
}
</style>
