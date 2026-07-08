<template>
  <div class="toolbar d-flex align-center justify-space-between flex-wrap ga-3">
    <VTextField
      v-model="search"
      placeholder="Search by name or id..."
      bg-color="surface-container"
      density="comfortable"
      max-width="384"
      min-width="220"
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      variant="solo-filled"
      clearable
      flat
      hide-details
      @click:clear="search = ''"
    />
    <div class="d-flex ga-3">
      <CreateDialog
        v-if="showCreateDialog"
        :anchor="anchor"
        :default-type="isCollection ? activeEntity : undefined"
        :open-in-editor="isCollection"
        :repository-id="currentRepositoryStore.repositoryId as number"
        @close="showCreateDialog = false"
      />
      <CopyDialog
        v-if="showCopyDialog"
        :action="InsertLocation.AddAfter"
        :anchor="anchor"
        :levels="rootLevelTypes"
        :repository-id="currentRepositoryStore.repositoryId as number"
        @close="showCopyDialog = false"
      />
      <LinkContent
        v-if="showLinkDialog"
        :action="InsertLocation.AddAfter"
        :anchor="anchor"
        @close="showLinkDialog = false"
        @completed="showLinkDialog = false"
      />
      <VBtn
        v-if="!isCollection && !isFlat"
        :disabled="!!search"
        :text="isOutlineExpanded ? 'Collapse all' : 'Expand all'"
        rounded="lg"
        variant="text"
        width="112"
        @click="currentRepositoryStore.toggleOutlineExpand"
      />
      <VMenu :offset="6" location="bottom end">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            color="primary"
            prepend-icon="mdi-plus"
            text="Add"
            variant="flat"
          />
        </template>
        <VList density="compact" min-width="200" nav>
          <VListItem
            prepend-icon="mdi-file-document-plus-outline"
            title="Create new"
            @click="showCreateDialog = true"
          />
          <VListItem
            prepend-icon="mdi-content-copy"
            title="Copy existing"
            @click="showCopyDialog = true"
          />
          <VListItem
            prepend-icon="mdi-link-variant"
            title="Link existing"
            @click="showLinkDialog = true"
          />
        </VList>
      </VMenu>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { filter, find, last, map } from 'lodash-es';
import { InsertLocation } from '@tailor-cms/utils';
import { storeToRefs } from 'pinia';

import CopyDialog from '@/components/repository/Outline/CopyActivity/index.vue';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import LinkContent from '@/components/repository/Library/LinkContent.vue';
import { useCurrentRepository } from '@/stores/current-repository';

withDefaults(
  defineProps<{
    activeEntity?: string;
  }>(),
  { activeEntity: '' },
);

const search = defineModel<string>('search', { default: '' });

const currentRepositoryStore = useCurrentRepository();
const {
  outlineActivities,
  rootActivities,
  taxonomy,
  isCollection,
  isOutlineExpanded,
} = storeToRefs(currentRepositoryStore);

const showCreateDialog = ref(false);
const showCopyDialog = ref(false);
const showLinkDialog = ref(false);

const isFlat = computed(() => {
  const types = map(
    filter(taxonomy.value, (it) => !it.rootLevel),
    'type',
  );
  if (!types.length) return false;
  return !find(outlineActivities.value, (it) => types.includes(it.type));
});

const anchor = computed(() => last(rootActivities.value));

const rootLevelTypes = computed(() =>
  map(filter(taxonomy.value, (it: any) => it.rootLevel), 'type'),
);
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}
</style>
