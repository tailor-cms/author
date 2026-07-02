<template>
  <VMenu
    v-if="submenu"
    location="end"
    offset="4"
    submenu
  >
    <template #activator="{ props }">
      <VListItem
        v-bind="props"
        title="Theme"
        prepend-icon="mdi-theme-light-dark"
        append-icon="mdi-chevron-right"
        rounded="lg"
      />
    </template>
    <VList class="d-flex flex-column" density="compact" slim nav>
      <VListItem
        v-for="{ value, title, icon } in themeOptions"
        :key="value"
        :active="mode === value"
        :prepend-icon="icon"
        :title="title"
        class="px-2"
        rounded="lg"
        @click="set(value)"
      />
    </VList>
  </VMenu>
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

withDefaults(defineProps<{ submenu?: boolean }>(), { submenu: false });

const { mode, set } = useColorMode();
</script>
