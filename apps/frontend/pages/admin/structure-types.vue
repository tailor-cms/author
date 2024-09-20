<template>
  <div class="pa-7 text-left">
    <VTextField
      v-model.trim="search"
      append-inner-icon="mdi-magnify"
      label="Search"
      variant="outlined"
      clearable
    />
    <VTreeview
      :items="schemas"
      :search="search"
      :slim="false"
      base-color="primary-darken-3"
      bg-color="transparent"
      class="pa-0"
      item-title="label"
      item-type=""
      item-value="id"
      open-all
      rounded
    >
      <template #prepend="{ item, isActive }">
        <VIcon
          :icon="`mdi-folder${isActive ? '-open' : ''}`"
          color="primary-darken-3"
        />
        <VIcon
          v-if="item.recursive"
          color="primary-darken-4"
          icon="mdi-replay"
        />
      </template>
    </VTreeview>
  </div>
</template>

<script lang="ts" setup>
import type { ActivityConfig } from '@tailor-cms/interfaces/schema';
import { computed, ref } from 'vue';
import { createId as cuid } from '@paralleldrive/cuid2';
import { VTreeview } from 'vuetify/labs/VTreeview';
import without from 'lodash/without';
import { useConfigStore } from '@/stores/config';

interface TreeItem {
  id: string;
  label: string;
  recursive?: boolean;
  children?: TreeItem[];
}

definePageMeta({
  name: 'installed-schemas',
});

const search = ref('');
const config = useConfigStore();

const buildTree = (type: string, structure: ActivityConfig[]) => {
  const id = cuid();
  const item = structure.find((it) => it.type === type);
  if (!item) return;
  const { subLevels, ...leaf } = item;
  if (!subLevels?.length) return { id, ...leaf };
  const recursive = subLevels?.includes(type);
  const children = without(subLevels, type)
    .map((type) => buildTree(type, structure))
    .filter(Boolean) as TreeItem[];
  return { id, children, recursive, ...leaf };
};

const schemas = computed<TreeItem[]>(() => {
  return config.availableSchemas.map(({ name: label, structure }: any) => {
    const roots = structure.filter((it: any) => it.rootLevel);
    const children = roots
      .map(({ type }: any) => buildTree(type, structure))
      .filter(Boolean) as TreeItem[];
    return { id: cuid(), label, children };
  });
});
</script>
