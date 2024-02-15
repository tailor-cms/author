<template>
  <div class="header">
    <div class="options-container">
      <ActivityOptions :activity="props.activity" class="float-right" />
    </div>
    <VBtn
      v-show="isEditable"
      class="px-4 mr-3 btn-open"
      color="teal-accent-1"
      variant="tonal"
      size="small"
      @click.stop="edit"
    >
      <VIcon class="mr-2">mdi-page-next-outline</VIcon>
      Open
    </VBtn>
    <Publishing
      v-if="store.repository?.hasAdminAccess"
      :activity="activity"
      :outline-activities="store.outlineActivities"
    />
  </div>
</template>

<script lang="ts" setup>
import ActivityOptions from '@/components/common/ActivityOptions/Menu.vue';
import get from 'lodash/get';
import Publishing from './Publishing.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps({
  activity: { type: Object, required: true },
});

const { $schemaService } = useNuxtApp() as any;
const store = useCurrentRepository();

const isEditable = computed(() => {
  const type = get(props.activity, 'type');
  return type && $schemaService.isEditable(type);
});

const edit = () => {
  if (!isEditable?.value) return;
  navigateTo({
    name: 'editor',
    params: { activityId: props.activity.id },
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
