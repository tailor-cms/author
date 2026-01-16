<template>
  <div class="tags-container">
    <div class="tag-list d-flex align-center ga-2 py-2">
      <VChip
        v-for="{ id, name, truncatedName } in tags"
        :key="id"
        close-label="Delete tag"
        color="primary-lighten-3"
        variant="tonal"
        size="small"
        label
      >
        <VTooltip
          :disabled="name.length === truncatedName.length"
          content-class="bg-primary-darken-4"
          location="bottom"
          offset="34"
          open-delay="100"
        >
          <template #activator="{ props: nameTooltipProps }">
            <div v-bind="nameTooltipProps">{{ truncatedName }}</div>
          </template>
          <span>{{ name }}</span>
        </VTooltip>
        <template #close>
          <VTooltip
            content-class="bg-primary-darken-4"
            location="bottom"
            offset="20"
            open-delay="100"
          >
            <template #activator="{ props: closeTooltipProps }">
              <VBtn
                v-bind="closeTooltipProps"
                :ripple="false"
                color="primary-lighten-3"
                icon="mdi-close-circle"
                variant="plain"
                @click.stop="showTagDeleteConfirmation(id, name)"
              />
            </template>
            Delete tag
          </VTooltip>
        </template>
      </VChip>
    </div>
    <VTooltip
      v-if="!exceededTagLimit"
      content-class="bg-primary-darken-4"
      location="bottom"
      offset="20"
      open-delay="400"
    >
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="tooltipProps"
          aria-label="Add tag"
          class="ml-2"
          color="primary-lighten-2"
          icon="mdi-tag-plus"
          @click.stop="showTagDialog = true"
        />
      </template>
      Add tag
    </VTooltip>
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
