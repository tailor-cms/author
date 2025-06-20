<template>
  <div class="header">
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
      color="teal-lighten-4"
      size="small"
      variant="tonal"
      @click.stop="edit"
    >
      <VIcon class="mr-2">mdi-page-next-outline</VIcon>
      Open
    </VBtn>
    <VBtn
      v-if="isSoftDeleted"
      class="mr-3"
      color="orange-lighten-4"
      size="small"
      variant="tonal"
      @click.stop="api.restore(store.repositoryId, props.activity.id)"
    >
      <VIcon class="mr-2">mdi-history</VIcon>
      Restore
    </VBtn>
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
import api from '@/api/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{ activity: StoreActivity }>();

const { $schemaService } = useNuxtApp() as any;
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
</script>

<style lang="scss" scoped>
.header {
  padding: 1rem 1rem 0;
}

.options-container {
  min-height: 1.5rem;
}

.btn-open {
  margin-right: 0.5rem;
}
</style>
