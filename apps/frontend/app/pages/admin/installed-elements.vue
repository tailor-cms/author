<template>
  <div class="installed-elements text-left">
    <VTextField
      v-model.trim="search"
      bg-color="transparent"
      class="element-search mb-4"
      density="comfortable"
      max-width="300"
      placeholder="Search elements..."
      prepend-inner-icon="mdi-magnify"
      rounded="xl"
      variant="solo-filled"
      clearable
      flat
      hide-details
    />
    <VCard
      v-for="(elements, group) in filteredRegistry"
      :key="group"
      class="bg-surface-sunken mb-4"
      rounded="lg"
      elevation="0"
    >
      <VCardItem class="py-3 px-4">
        <VCardTitle class="text-title-medium d-flex align-center ga-2">
          {{ startCase(group) }}
          <VChip :text="`${elements.length}`" density="comfortable" size="small" />
        </VCardTitle>
      </VCardItem>
      <VAlert
        v-if="!elements.length"
        class="ma-4 mt-0"
        icon="mdi-information-outline"
        text="No elements found!"
        variant="tonal"
      />
      <VRow v-else class="pa-4 pt-0" density="compact">
        <VCol
          v-for="{ name, ui, version, position, ai } in elements"
          :key="position"
          cols="12"
          lg="3"
          md="4"
          sm="6"
        >
          <VCard
            class="pa-3 h-100"
            color="surface-raised"
            rounded="lg"
            elevation="1"
          >
            <div class="d-flex align-center ga-3">
              <VAvatar color="surface-container-highest" size="36">
                <VIcon :icon="ui.icon || DEFAULT_ICON" size="20" />
              </VAvatar>
              <div class="overflow-hidden">
                <div class="text-body-medium text-truncate">{{ name }}</div>
                <div class="text-label-small text-medium-emphasis">
                  Version {{ version }}
                </div>
              </div>
              <VSpacer />
              <VIcon
                v-if="ai"
                v-tooltip:bottom="{ text: 'AI Powered', openDelay: 500 }"
                aria-label="AI Powered"
                color="tertiary"
                icon="mdi-creation"
                size="18"
              />
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VCard>
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
