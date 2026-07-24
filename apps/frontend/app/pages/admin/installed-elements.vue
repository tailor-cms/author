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
      v-for="(elements, group) in visibleGroups"
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
      <VRow class="pa-4 pt-0" density="compact">
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
                color="secondary"
                icon="mdi-creation"
                size="18"
              />
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VCard>
    <TailorEmptyState
      v-if="isEmpty(visibleGroups)"
      v-bind="emptyState"
      @click:action="search = ''"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { isEmpty, partition, pickBy, startCase } from 'lodash-es';
import { TailorEmptyState } from '@tailor-cms/core-components';

definePageMeta({ name: 'installed-elements' });
useHead({ title: 'Installed Elements' });

const DEFAULT_ICON = 'mdi-help-rhombus';

const { $ceRegistry } = useNuxtApp() as any;
const search = ref('');

// Split the registry into groups, keep only the ones with matches.
const visibleGroups = computed(() => {
  const term = search.value.trim().toLowerCase();
  const matches = $ceRegistry.all.filter(({ name }: any) =>
    name.toLowerCase().includes(term),
  );
  const [questions, contentElements] = partition(matches, 'isQuestion');
  return pickBy({ contentElements, questions }, 'length');
});

const emptyState = computed(() => search.value
  ? {
      actionText: 'Clear search',
      icon: 'mdi-magnify',
      prependActionIcon: 'mdi-close',
      text: 'No elements match your search.',
      title: 'No matches',
    }
  : {
      icon: 'mdi-puzzle-outline',
      text: 'Installed content elements will appear here.',
      title: 'No elements installed',
    },
);
</script>
