<template>
  <div class="tags-container">
    <div class="tag-list d-flex align-center ga-2 py-2">
      <VChip
        v-for="{ id, name, truncatedName } in tags"
        :key="id"
        close-label="Delete tag"
        size="small"
        rounded="lg"
      >
        <div
          v-tooltip:bottom="{
            text: name,
            openDelay: 100,
            disabled: name.length === truncatedName.length,
          }">
          {{ truncatedName }}
        </div>
        <template #close>
          <VIcon
            v-tooltip:bottom="{ text: 'Delete tag', openDelay: 100 }"
            @click.stop="showTagDeleteConfirmation(id, name)"
          />
        </template>
      </VChip>
    </div>
    <VBtn
      v-if="!exceededTagLimit"
      v-tooltip:bottom="{ text: 'Add tag', openDelay: 400 }"
      aria-label="Add tag"
      class="text-medium-emphasis ml-2"
      icon="mdi-tag-plus"
      @click.stop="showTagDialog = true"
    />
    <AddTag
      :is-visible="showTagDialog"
      :repository="repository"
      @close="closeAddTagDialog"
    />
  </div>
</template>

<script lang="ts" setup>
import { clamp, get, map, truncate } from 'lodash-es';
import type { Repository } from '@tailor-cms/interfaces/repository';

import AddTag from './AddTag.vue';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useRepositoryStore } from '@/stores/repository';

const TAG_LIMIT = 3;

const props = defineProps<{ repository: Repository }>();
const repositoryStore = useRepositoryStore();

const showTagDialog = ref(false);

const tagCount = computed(() => get(props.repository, 'tags.length', 0));
const exceededTagLimit = computed(() => tagCount.value >= TAG_LIMIT);
const maxTagNameLength = computed(
  () => [20, 15, 12][clamp(tagCount.value - 1, 0, 2)],
);

const tags = computed(() => {
  return map(props.repository.tags, ({ name, ...rest }) => {
    const truncatedName = truncate(name, { length: maxTagNameLength.value });
    return { ...rest, name, truncatedName };
  });
});

const closeAddTagDialog = () => {
  showTagDialog.value = false;
};

const showTagDeleteConfirmation = (tagId: number, tagName: string) => {
  const showConfirmationDialog = useConfirmationDialog();
  showConfirmationDialog({
    title: 'Delete tag',
    color: 'error',
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
  min-height: 3rem;
}
</style>
