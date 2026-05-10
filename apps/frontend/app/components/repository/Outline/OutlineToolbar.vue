<template>
  <div class="toolbar d-flex align-center flex-wrap ga-4">
    <template v-if="isCollection">
      <VSpacer />
      <CreateDialog
        :anchor="anchor"
        :repository-id="currentRepositoryStore.repositoryId as number"
        activator-color="teal-lighten-3"
        activator-icon="mdi-plus"
        class="text-none mr-2"
        size="small"
        variant="tonal"
        rounded="lg"
        show-activator
      />
    </template>
    <template v-else>
      <VHover>
        <template #default="{ props: hoverProps }">
          <VTextField
            v-bind="hoverProps"
            v-model="search"
            :bg-color="'transparent'"
            density="compact"
            min-width="220"
            placeholder="Search by name or id..."
            prepend-inner-icon="mdi-magnify"
            rounded="xl"
            variant="outlined"
            clearable
            hide-details
            @click:clear="search = ''"
          />
        </template>
      </VHover>
      <VSpacer />
      <VBtn
        v-if="!isFlat"
        :disabled="!!search"
        class="text-none"
        color="teal-lighten-3"
        variant="tonal"
        rounded="lg"
        size="small"
        @click="currentRepositoryStore.toggleOutlineExpand"
      >
        Toggle all
      </VBtn>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { filter, find, last, map } from 'lodash-es';
import { storeToRefs } from 'pinia';

import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const search = defineModel<string>('search', { default: '' });

const currentRepositoryStore = useCurrentRepository();
const { outlineActivities, rootActivities, taxonomy, isCollection } =
  storeToRefs(currentRepositoryStore);

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

.v-text-field {
  max-width: 24rem;
  transition: all 1s;

  :deep(.v-field__outline) {
    display: none;
  }
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
