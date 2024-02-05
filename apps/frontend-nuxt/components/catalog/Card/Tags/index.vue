<template>
  <div class="tags-container">
    <div class="tag-list d-flex align-center">
      <VChip
        v-for="{ id, name, truncatedName } in tags"
        :key="id"
        class="mr-2 mb-1"
        close-icon="mdi-close-circle"
        close-label="Remove tag"
        color="primary-lighten-1"
        variant="tonal"
        closable
        label
        @click:close="showDeleteConfirmation(id, name)"
      >
        <VTooltip
          :disabled="name.length === truncatedName.length"
          location="bottom"
          open-delay="100"
        >
          <template #activator="{ props: tooltipProps }">
            <div v-bind="tooltipProps">{{ truncatedName }}</div>
          </template>
          <span>{{ name }}</span>
        </VTooltip>
      </VChip>
    </div>
    <VTooltip v-if="!exceededTagLimit" location="bottom" open-delay="400">
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="tooltipProps"
          aria-label="Add tag"
          color="primary-lighten-3"
          icon="mdi-tag-plus"
          @click.stop="showTagDialog = true"
        >
        </VBtn>
      </template>
      Add tag
    </VTooltip>
    <AddTag
      v-if="showTagDialog"
      :repository="repository"
      @close="showTagDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import clamp from 'lodash/clamp';
import get from 'lodash/get';
import map from 'lodash/map';
import truncate from 'lodash/truncate';

import AddTag from './AddTag.vue';
import type { Repository } from '@/api/interfaces/repository';
import { useRepositoryStore } from '@/stores/repository';

const props = defineProps<{ repository: Repository }>();

const TAG_LIMIT = 3;
const { $eventBus } = useNuxtApp() as any;
const repositoryStore = useRepositoryStore();

const showTagDialog = ref(false);
const tagCount = computed(() => get(props.repository, 'tags.length', 0));
const exceededTagLimit = computed(() => tagCount.value >= TAG_LIMIT);
const maxTagNameLength = computed(
  () => [15, 6, 5][clamp(tagCount.value - 1, 0, 2)],
);

const tags = computed(() => {
  return map(props.repository.tags, (tag) => {
    const truncatedName = truncate(tag.name, {
      length: maxTagNameLength.value,
    });
    return { ...tag, truncatedName };
  });
});

const showDeleteConfirmation = (tagId: number, tagName: string) => {
  $eventBus.channel('app').emit('showConfirmationModal', {
    title: 'Delete tag',
    message: `Are you sure you want to delete tag ${tagName}?`,
    action: () => repositoryStore.removeTag(props.repository.id, tagId),
  });
};
</script>

<style lang="scss" scoped>
.tags-container {
  display: flex;
  justify-content: space-between;
  flex-basis: 100%;
}

.tag-list {
  padding: 0.25rem 0 0 0.25rem;
}
</style>
