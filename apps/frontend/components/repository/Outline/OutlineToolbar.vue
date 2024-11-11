<template>
  <VToolbar class="toolbar" color="transparent">
    <VHover v-if="hasActivities" v-slot="{ isHovering, props: hoverProps }">
      <VTextField
        v-bind="hoverProps"
        v-model="search"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        :class="{ 'mr-4': !isFlat }"
        density="comfortable"
        placeholder="Search by name or id..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="outlined"
        clearable
        hide-details
        @click:clear="search = ''"
      />
    </VHover>
    <template v-if="!isHierarchyStyle">
      <VHover v-if="hasActivities" v-slot="{ isHovering, props: hoverProps }">
        <VSelect
          v-bind="hoverProps"
          v-model="activityTypes"
          :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
          :items="activityTypeOptions"
          density="comfortable"
          item-title="label"
          item-value="type"
          max-width="232"
          placeholder="Filter by type"
          rounded="xl"
          variant="solo"
          clearable
          flat
          hide-details
          multiple
        />
      </VHover>
      <VSpacer />
      <CreateDialog
        :anchor="anchor"
        :repository-id="repositoryStore.repositoryId as number"
        activator-color="primary-lighten-4"
        class="px-4"
        variant="tonal"
        show-activator
      />
    </template>
    <VBtn
      v-else-if="!isFlat && hasActivities"
      :disabled="!!search"
      class="px-5"
      color="primary-lighten-4"
      height="42"
      variant="tonal"
      @click="repositoryStore.toggleOutlineExpand"
    >
      Toggle all
    </VBtn>
  </VToolbar>
</template>

<script lang="ts" setup>
import {
  type ActivityConfig,
  OutlineStyle,
} from '@tailor-cms/interfaces/schema';
import filter from 'lodash/filter';
import find from 'lodash/find';
import last from 'lodash/last';
import map from 'lodash/map';

import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{
  activityTypeOptions: ActivityConfig[];
  hasActivities: boolean;
}>();

const search = defineModel<string | null>('search', { default: null });
const activityTypes = defineModel<string[]>('activityTypes', {
  default: () => [],
});

defineEmits(['search']);

const repositoryStore = useCurrentRepository();
const { outlineActivities, rootActivities, schemaOutlineStyle, taxonomy } =
  storeToRefs(repositoryStore);

const isHierarchyStyle = computed(
  () => schemaOutlineStyle.value === OutlineStyle.Hierarchical,
);

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
