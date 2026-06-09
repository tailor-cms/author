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
      bg-color="transparent"
      class="pa-0"
      rounded="lg"
      nav
    >
      <VListGroup
        v-for="(elements, group) in filteredRegistry"
        :key="group"
        :value="group"
      >
        <template #activator="{ props: activatorProps }">
          <VListItem
            v-bind="activatorProps"
            :title="startCase(group)"
            class="pa-0 px-4"
          />
        </template>
        <VAlert
          v-if="!elements.length"
          class="ma-4"
          icon="mdi-information-outline"
          text="No elements found!"
          variant="tonal"
        />
        <VListItem
          v-for="{ name, ui, version, position, ai } in elements"
          v-else
          :key="position"
          :prepend-icon="ui.icon || DEFAULT_ICON"
          :subtitle="`Version ${version}`"
          :title="name"
          class="pa-0 px-8"
        >
          <template v-if="ai" #append>
            <VChip
              text="AI Powered"
              size="x-small"
              color="secondary"
              prepend-icon="mdi-creation"
              rounded
            />
          </template>
        </VListItem>
      </VListGroup>
    </VList>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { startCase } from 'lodash-es';

interface Registry {
  contentElements: any[];
  questions: any[];
}

definePageMeta({
  name: 'installed-elements',
});

const DEFAULT_ICON = 'mdi-help-rhombus';

const { $ceRegistry } = useNuxtApp() as any;
const search = ref('');

const registry = computed<Registry>(() => {
  return $ceRegistry.all.reduce(
    (registry: Registry, item: any) => {
      const group = item.isQuestion ? 'questions' : 'contentElements';
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
