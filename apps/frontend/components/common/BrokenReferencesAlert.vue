<template>
  <div v-show="$brokenReferences.warnings.length">
    <VAlert
      class="mt-5 text-left text-subtitle-1"
      color="yellow-lighten-4"
      icon="mdi-alert"
      variant="tonal"
      prominent
    >
      <div class="mt-3 text-subtitle-1 font-weight-bold">Detected Issues:</div>
      <div class="pl-1 pr-5 text-subtitle-1">
        <VCard
          v-for="(warning, index) in $brokenReferences.warnings"
          :key="index"
          class="my-4 pa-4"
          variant="tonal"
        >
          {{ index + 1 }}.
          {{ warning.message }}
          <a
            v-if="warning.id"
            class="text-yellow-accent-1"
            href="#"
            @click.stop="repositoryStore.selectActivity(warning.id)"
          >
            Click to select the item.
          </a>
          <NuxtLink
            v-else-if="warning.link"
            :to="warning.link"
            class="text-yellow-accent-1"
          >
            Click to navigate to the item.
          </NuxtLink>
        </VCard>
      </div>
      <VBtn
        class="mt-4 ml-1"
        color="yellow-darken-2"
        variant="tonal"
        @click="repositoryStore.cleanupReferences()"
      >
        Remove all broken references
      </VBtn>
    </VAlert>
  </div>
</template>

<script lang="ts" setup>
import { useCurrentRepository } from '@/stores/current-repository';

const repositoryStore = useCurrentRepository();

const { $brokenReferences } = storeToRefs(repositoryStore);
</script>
