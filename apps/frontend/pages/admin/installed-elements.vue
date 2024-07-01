<template>
  <div class="pa-7 text-left">
    <VTextField
      v-model.trim="search"
      append-inner-icon="mdi-magnify"
      label="Search"
      variant="outlined"
      clearable
    />
    <VList
      :opened="Object.keys(filteredRegistry)"
      class="pa-0"
      rounded="lg"
      border
      slim
    >
      <VListGroup
        v-for="(elements, group) in filteredRegistry"
        :key="group"
        :value="group"
      >
        <template #activator="{ props: activatorProps }">
          <VListItem v-bind="activatorProps">
            <VListItemTitle>{{ startCase(group) }}</VListItemTitle>
          </VListItem>
        </template>
        <VAlert
          v-if="!elements.length"
          class="ma-4"
          color="primary-lighten-1"
          icon="mdi-information-outline"
          variant="tonal"
        >
          No elements found!
        </VAlert>
        <VListItem
          v-for="{ name, ui, version, position } in elements"
          v-else
          :key="position"
          lines="two"
        >
          <template #prepend>
            <VIcon :icon="ui.icon || DEFAULT_ICON" size="x-large" />
          </template>
          <VListItemTitle>{{ name }}</VListItemTitle>
          <VListItemSubtitle>Version {{ version }}</VListItemSubtitle>
        </VListItem>
      </VListGroup>
    </VList>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import startCase from 'lodash/startCase';

interface Registry {
  contentElements: any[];
  questions: any[];
}

definePageMeta({
  name: 'installed-elements',
});

const DEFAULT_ICON = 'mdi-help-rhombus';
const QUESTION_TYPES = ['ASSESSMENT', 'QUESTION'];

const { $ceRegistry } = useNuxtApp() as any;
const search = ref('');

const registry = computed<Registry>(() => {
  return $ceRegistry.all.reduce(
    (registry: Registry, item: any) => {
      const group = QUESTION_TYPES.includes(item.type)
        ? 'questions'
        : 'contentElements';
      registry[group].push(item);
      return registry;
    },
    { contentElements: [], questions: [] },
  );
});

const filteredRegistry = computed<Registry>(() => {
  if (!search.value) return registry.value;
  const cond = ({ name }: { name: string }) =>
    name.toLowerCase().includes(search.value.toLowerCase());
  return {
    contentElements: registry.value.contentElements.filter(cond),
    questions: registry.value.questions.filter(cond),
  };
});
</script>
