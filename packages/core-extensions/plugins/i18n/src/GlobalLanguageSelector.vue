<template>
  <VMenu v-if="i18n.isEnabled" location="end" offset="8">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        :aria-label="`Content language: ${currentLanguage?.toUpperCase() ?? 'EN'}`"
        class="language-selector ma-2"
        color="primary"
        size="small"
        variant="tonal"
        rounded="lg"
      >
        <VIcon icon="mdi-translate" size="18" />
        <span class="text-uppercase ml-1 text-body-small font-weight-bold">
          {{ currentLanguage ?? 'en' }}
        </span>
      </VBtn>
    </template>
    <VList density="compact" min-width="200" slim nav>
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
          <VIcon v-if="isDefault(code)" color="warning" icon="mdi-star" size="small" />
          <VIcon v-else icon="mdi-translate-variant" size="small" />
        </template>
        <template v-if="isCurrent(code)" #append>
          <VIcon color="primary" icon="mdi-check-circle" size="small" />
        </template>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

<style scoped>
.language-selector {
  min-width: unset;
  padding-inline: 0.5rem;
}
</style>
