<template>
  <div class="structure-types text-left">
    <div class="d-flex align-center ga-4 mb-4">
      <VTextField
        v-model.trim="search"
        bg-color="transparent"
        class="schema-search"
        density="comfortable"
        max-width="300"
        placeholder="Search schemas..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="solo-filled"
        clearable
        flat
        hide-details
        @click:clear="search = ''"
      />
      <VSpacer />
      <VBtn
        :disabled="!!search"
        :text="isAllExpanded ? 'Collapse all' : 'Expand all'"
        rounded="lg"
        variant="text"
        width="112"
        @click="toggleAll"
      />
    </div>
    <SchemaCard
      v-for="schema in filteredSchemas"
      :key="schema.label"
      :is-expanded="isExpanded(schema.label)"
      :schema="schema"
      @toggle="toggle(schema.label)"
    />
    <TailorEmptyState
      v-if="!filteredSchemas.length"
      :icon="
        debouncedSearch ? 'mdi-file-search-outline' : 'mdi-file-tree-outline'
      "
      :text="
        debouncedSearch
          ? `No schemas match “${debouncedSearch}”.`
          : 'Installed schemas will appear here.'
      "
      :title="debouncedSearch ? 'No matches' : 'No schemas installed'"
      class="mt-4"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type {
  ActivityConfig,
  I18nConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { TailorEmptyState } from '@tailor-cms/core-components';
import { createId as cuid } from '@paralleldrive/cuid2';
import { refDebounced } from '@vueuse/core';
import { map, without, xor } from 'lodash-es';

import SchemaCard from '@/components/admin/SchemaCard/index.vue';
import type { TreeItem } from '@/components/admin/SchemaCard/types';
import { useConfigStore } from '@/stores/config';

definePageMeta({
  name: 'installed-schemas',
});

const search = ref('');
const debouncedSearch = refDebounced(search, 150);
const config = useConfigStore();
const expanded = ref<string[]>([]);

const buildTree = (type: string, structure: ActivityConfig[]) => {
  const id = cuid();
  const item = structure.find((it) => it.type === type);
  if (!item) return;
  const { subLevels, ...leaf } = item;
  if (!subLevels?.length) return { id, ...leaf, type: undefined };
  const recursive = subLevels?.includes(type);
  const children = without(subLevels, type)
    .map((type) => buildTree(type, structure))
    .filter(Boolean) as TreeItem[];
  return { id, children, recursive, ...leaf, type: undefined };
};

const getLanguages = (i18n?: I18nConfig) => {
  if (!i18n?.enabled || !i18n.languages?.length) return null;
  const { languages, defaultLanguage } = i18n;
  const codes = languages.map(({ code }) => code.toUpperCase()).join(' · ');
  const names = languages
    .map(({ code, name }) => code === defaultLanguage ? `${name} (default)` : name)
    .join(', ');
  return { codes, names };
};

const schemas = computed(() => {
  return config.availableSchemas.map((schema: Schema) => {
    const { name: label, description, collection, i18n, structure } = schema;
    const roots = structure.filter((it: any) => it.rootLevel);
    const children = roots
      .map(({ type }: any) => buildTree(type, structure))
      .filter(Boolean) as TreeItem[];
    const languages = getLanguages(i18n);
    return { label, description, collection, languages, children };
  });
});

// Keep a node when it matches (with its whole subtree) or when any
// descendant does (pruned to the matching paths).
const filterTree = (items: TreeItem[], term: string): TreeItem[] =>
  items.flatMap((item) => {
    if (item.label.toLowerCase().includes(term)) return [item];
    const children = filterTree(item.children ?? [], term);
    return children.length ? [{ ...item, children }] : [];
  });

const filteredSchemas = computed(() => {
  const term = debouncedSearch.value.toLowerCase();
  if (!term) return schemas.value;
  return schemas.value.flatMap((schema) => {
    if (schema.label.toLowerCase().includes(term)) return [schema];
    const children = filterTree(schema.children, term);
    return children.length ? [{ ...schema, children }] : [];
  });
});

// A collapsed card would hide its own search hits; force cards open
// while a query is active.
const isExpanded = (label: string) =>
  !!debouncedSearch.value || expanded.value.includes(label);

const toggle = (label: string) => {
  if (debouncedSearch.value) return;
  expanded.value = xor(expanded.value, [label]);
};

const isAllExpanded = computed(() =>
  schemas.value.every(({ label }) => expanded.value.includes(label)),
);

const toggleAll = () => {
  if (isAllExpanded.value) return (expanded.value = []);
  expanded.value = map(schemas.value, 'label');
};
</script>

<style lang="scss" scoped>
.schema-search :deep(.v-field__outline) {
  display: none;
}
</style>
