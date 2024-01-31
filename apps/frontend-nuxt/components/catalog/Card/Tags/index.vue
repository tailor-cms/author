<template>
  <div class="tags-container">
    <div class="tag-list d-flex align-center">
      <VChip
        v-for="{ id, name, truncatedName } in tags"
        :key="id"
        @click:close="showDeleteConfirmation(id, name)"
        class="mr-2 mb-1"
        close-icon="mdi-close-circle"
        close-label="Remove tag"
        color="primary-lighten-1"
        variant="tonal"
        closable label
      >
        <VTooltip
          :disabled="name.length === truncatedName.length"
          open-delay="100"
          location="bottom"
        >
          <template v-slot:activator="{ props }">
            <div v-bind="props">{{ truncatedName }}</div>
          </template>
          <span>{{ name }}</span>
        </VTooltip>
      </VChip>
    </div>
    <VTooltip v-if="!exceededTagLimit" open-delay="400" location="bottom">
      <template v-slot:activator="{ props }">
        <VBtn
          v-bind="props"
          @click.stop="showTagDialog = true"
          color="primary-lighten-3"
          aria-label="Add tag"
          icon="mdi-tag-plus"
        >
        </VBtn>
      </template>
      Add tag
    </VTooltip>
    <!-- <AddTag
      v-if="showTagDialog"
      @close="showTagDialog = false"
      :repository="props.repository" /> -->
  </div>
</template>

<script lang="ts" setup>
import type { Repository } from '@/api/interfaces/repository';

// import AddTag from './AddTag.vue';
import clamp from 'lodash/clamp';
import get from 'lodash/get';
import map from 'lodash/map';
import truncate from 'lodash/truncate';
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
    action: () => repositoryStore.removeTag(props.repository.id, tagId)
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
