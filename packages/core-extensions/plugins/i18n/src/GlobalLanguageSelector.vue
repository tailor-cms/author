<template>
  <VMenu v-if="i18n.isEnabled" location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn v-bind="menuProps" color="primary-lighten-4">
        <VIcon icon="mdi-translate" start />
        <span class="text-uppercase">{{ currentLanguage ?? 'en' }}</span>
        <VIcon icon="mdi-chevron-down" size="small" end />
      </VBtn>
    </template>
    <VList density="compact" min-width="200" slim>
      <VListSubheader>Content Language</VListSubheader>
      <VListItem
        v-for="{ code, name } in i18n.availableLanguages"
        :key="code"
        :active="isCurrent(code)"
        :subtitle="code.toUpperCase()"
        :title="name"
        @click="currentLanguage = code"
      >
        <template #prepend>
          <VIcon
            :icon="isDefault(code) ? 'mdi-star' : 'mdi-translate-variant'"
            :color="isDefault(code) ? 'warning' : 'grey-darken-3'"
            size="small"
          />
        </template>
        <template v-if="isCurrent(code)" #append>
          <VIcon color="primary" icon="mdi-check-circle" />
        </template>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Get i18n store from Nuxt app context (injected by frontend)
const { $i18n: i18n } = useNuxtApp() as any;
const currentLanguage = computed({
  get: () => i18n.currentLanguage,
  set(code) {
    i18n.setLanguage(code);
  },
});

const isCurrent = (code: string) => code === currentLanguage.value;
const isDefault = (code: string) => code === i18n.defaultLanguage;
</script>
