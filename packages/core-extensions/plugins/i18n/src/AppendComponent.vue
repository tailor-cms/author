<template>
  <VTooltip v-if="i18n.isEnabled && isTranslatable" location="top">
    <template #activator="{ props: tooltipProps }">
      <VChip
        v-bind="tooltipProps"
        :color="badgeColor"
        class="ml-2 i18n-badge"
        size="x-small"
        variant="tonal"
      >
        <VIcon size="14" start>mdi-translate</VIcon>
        {{ translatedCount }}/{{ totalLanguages }}
        <span v-if="displayedLang?.isFallback" class="ml-1 fallback-indicator">
          ({{ displayedLang.code.toUpperCase() }})
        </span>
      </VChip>
    </template>
    <div class="pa-2">
      <VAlert
        v-if="displayedLang?.isFallback"
        class="mb-3 pa-2 text-caption bg-grey-lighten-1"
      >
        <VIcon size="14" class="mr-1">mdi-alert</VIcon>
        Showing {{ getLanguageName(displayedLang.code) }} (fallback)
      </VAlert>
      <div class="text-caption mb-2 font-weight-bold">Translation Status</div>
      <div
        v-for="lang in i18n.availableLanguages"
        :key="lang.code"
        class="d-flex align-center mb-1"
      >
        <VIcon
          :icon="
            translationStatus[lang.code]
              ? 'mdi-check-circle'
              : 'mdi-circle-outline'
          "
          :color="translationStatus[lang.code] ? 'success' : 'grey-lighten-1'"
          class="mr-2"
          size="16"
        />
        <span :class="{ 'text-grey': !translationStatus[lang.code] }">
          {{ lang.name }}
        </span>
        <VChip v-if="lang.code === i18n.defaultLanguage" class="ml-2" size="x-small">
          default
        </VChip>
      </div>
    </div>
  </VTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  meta: { key: string; type: string };
  data: Record<string, any>;
  dark: boolean;
}

interface Language {
  code: string;
  name: string;
}

const props = defineProps<Props>();

const { $i18n: i18n, $metaRegistry } = useNuxtApp() as any;

// Check if this meta type supports i18n
const isTranslatable = computed(() => {
  const metaType = $metaRegistry.get(props.meta.type?.toUpperCase());
  return metaType?.i18n === true;
});

const translationStatus = computed(() =>
  i18n.getTranslationStatus(props.data, props.meta.key),
);

const translatedCount = computed(
  () => Object.values(translationStatus.value).filter(Boolean).length,
);

const totalLanguages = computed(() => i18n.availableLanguages.length);

// Detect which language is being displayed (fallback detection)
const displayedLang = computed(() =>
  i18n.getDisplayedLanguage(props.data, props.meta.key),
);

// Get human-readable language name
const getLanguageName = (code: string): string => {
  const lang = i18n.availableLanguages.find((l: Language) => l.code === code);
  return lang?.name ?? code.toUpperCase();
};

const badgeColor = computed(() => {
  const ratio = translatedCount.value / totalLanguages.value;
  if (ratio === 1) return props.dark ? 'teal-lighten-3' : 'teal';
  if (ratio === 0) return props.dark ? 'orange-lighten-2' : 'orange-darken-3';
  return props.dark ? 'secondary-lighten-3' : 'secondary';
});
</script>

<style scoped>
.i18n-badge {
  cursor: help;
}

.fallback-indicator {
  font-size: 0.65rem;
  opacity: 0.8;
}
</style>
