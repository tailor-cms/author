<template>
  <VBtnToggle
    v-if="inline"
    :model-value="mode"
    class="theme-toggle"
    density="comfortable"
    rounded="lg"
    variant="text"
    border
    divided
    mandatory
    @update:model-value="set"
  >
    <VBtn
      v-for="{ value, icon, title } in themeOptions"
      :key="value"
      v-tooltip:bottom="title"
      :value="value"
      :icon="icon"
      :aria-label="title"
      height="28"
      size="small"
    />
  </VBtnToggle>
  <VMenu
    v-else
    location="bottom end"
    min-width="180"
    offset="8"
    transition="slide-y-transition"
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        aria-label="Select theme"
        icon="mdi-theme-light-dark"
        variant="text"
      />
    </template>
    <VList density="compact" nav>
      <VListItem
        v-for="{ value, title, icon } in themeOptions"
        :key="value"
        :active="mode === value"
        :prepend-icon="icon"
        :title="title"
        @click="set(value)"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import { themeOptions, useColorMode } from '@/composables/useColorMode';

withDefaults(defineProps<{ inline?: boolean }>(), { inline: false });

const { mode, set } = useColorMode();
</script>

<style lang="scss" scoped>
.theme-toggle {
  height: auto;
}
</style>
