<template>
  <div class="tags-container">
    <div class="tag-list mb-1 d-flex align-center">
      <VChip
        v-for="{ id, name, truncatedName } in tags"
        :key="id"
        class="mr-2"
        close-label="Remove tag"
        color="primary-lighten-1"
        variant="tonal"
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
                color="primary-lighten-1"
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
import clamp from 'lodash/clamp';
import get from 'lodash/get';
import map from 'lodash/map';
import type { Repository } from 'tailor-interfaces/repository';
import truncate from 'lodash/truncate';

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
  () => [15, 6, 5][clamp(tagCount.value - 1, 0, 2)],
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
}

.tag-list {
  padding: 0.25rem 0 0 0.25rem;
}
</style>
