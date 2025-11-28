<template>
  <VMenu v-if="i18n.isEnabled" location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        class="text-none"
        color="primary-lighten-4"
        variant="text"
      >
        <VIcon start>mdi-translate</VIcon>
        {{ currentLanguageCode }}
        <VIcon size="small" end>mdi-chevron-down</VIcon>
      </VBtn>
    </template>
    <VList density="compact" min-width="200">
      <VListSubheader>Content Language</VListSubheader>
      <VListItem
        v-for="lang in i18n.availableLanguages"
        :key="lang.code"
        :active="lang.code === i18n.currentLanguage"
        @click="i18n.setLanguage(lang.code)"
      >
        <template #prepend>
          <VIcon
            :icon="lang.isDefault ? 'mdi-star' : 'mdi-translate-variant'"
            :color="lang.isDefault ? 'warning' : 'grey-darken-3'"
            size="small"
          >
          </VIcon>
        </template>
        <VListItemTitle>{{ lang.name }}</VListItemTitle>
        <VListItemSubtitle>{{ lang.code.toUpperCase() }}</VListItemSubtitle>
        <template #append>
          <VIcon v-if="lang.code === i18n.currentLanguage" color="primary">
            mdi-check
          </VIcon>
        </template>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Get i18n store from Nuxt app context (injected by frontend)
const { $i18n: i18n } = useNuxtApp() as { $i18n: any };
const currentLanguageCode = computed(() =>
  (i18n.currentLanguage?.value ?? i18n.currentLanguage ?? 'en').toUpperCase(),
);
</script>
