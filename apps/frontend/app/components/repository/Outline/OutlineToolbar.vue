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
        v-if="isCollection"
        :anchor="anchor"
        :default-type="activeEntity"
        :repository-id="currentRepositoryStore.repositoryId as number"
        activator-color="primary"
        activator-icon="mdi-plus"
        variant="flat"
        open-in-editor
        show-activator
      />
      <template v-else>
        <VBtn
          v-if="!isFlat"
          :disabled="!!search"
          :text="isOutlineExpanded ? 'Collapse all' : 'Expand all'"
          rounded="lg"
          variant="text"
          width="112"
          @click="currentRepositoryStore.toggleOutlineExpand"
        />
        <LinkContent :anchor="anchor" show-activator />
        <CreateDialog
          :anchor="anchor"
          :repository-id="currentRepositoryStore.repositoryId as number"
          activator-color="primary"
          activator-icon="mdi-plus"
          variant="flat"
          test-id-prefix="repository__createRootActivity"
          show-activator
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { filter, find, last, map } from 'lodash-es';
import { storeToRefs } from 'pinia';

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

const isFlat = computed(() => {
  const types = map(
    filter(taxonomy.value, (it) => !it.rootLevel),
    'type',
  );
  if (!types.length) return false;
  return !find(outlineActivities.value, (it) => types.includes(it.type));
});

const anchor = computed(() => last(rootActivities.value));
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}
</style>
