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
      class="pa-0"
      item-title="label"
      item-type=""
      border
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
import { computed, ref } from 'vue';
import { createId as cuid } from '@paralleldrive/cuid2';
import { SCHEMAS } from 'tailor-config-shared';
import { VTreeview } from 'vuetify/labs/VTreeview';
import without from 'lodash/without';

definePageMeta({
  name: 'installed-schemas',
});

const search = ref('');

const buildTree = (type: string, structure: any[]) => {
  const id = cuid();
  const { subLevels, ...leaf } = structure.find((it) => it.type === type);
  if (!subLevels.length) return { id, ...leaf };
  const recursive = subLevels.includes(type);
  const children = without(subLevels, type).map((type) =>
    buildTree(type, structure),
  );
  return { id, children, recursive, ...leaf };
};

const schemas = computed(() => {
  return SCHEMAS.map(({ name: label, structure }) => {
    const roots = structure.filter((it) => it.rootLevel);
    const children = roots.map(({ type }) => buildTree(type, structure));
    return { id: cuid(), label, children };
  });
});
</script>
