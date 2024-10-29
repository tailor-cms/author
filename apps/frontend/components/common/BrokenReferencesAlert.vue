<template>
  <div v-show="errors.length">
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
          v-for="({ id, link, message }, index) in errors"
          :key="index"
          class="my-4 pa-4"
          variant="tonal"
        >
          {{ index + 1 }}. {{ message }}
          <a
            v-if="id"
            class="text-yellow-accent-1"
            href="#"
            @click.stop="repositoryStore.selectActivity(id)"
          >
            Click to select the item.
          </a>
          <NuxtLink v-else-if="link" :to="link" class="text-yellow-accent-1">
            Click to navigate to the item.
          </NuxtLink>
        </VCard>
      </div>
      <VBtn
        class="mt-4 ml-1"
        color="yellow-darken-2"
        variant="tonal"
        @click="cleanupReferences"
      >
        Remove all broken references
      </VBtn>
    </VAlert>
  </div>
</template>

<script lang="ts" setup>
import { schema as schemaConfig } from 'tailor-config-shared';

import { repository as api } from '@/api';
import { useCurrentRepository } from '@/stores/current-repository';

interface ReferenceError {
  id?: string;
  link?: string;
  message: string;
}

const { $ceRegistry } = useNuxtApp() as any;
const repositoryStore = useCurrentRepository();

const errorReport = ref<any>([]);
const errors = ref<ReferenceError[]>([]);

const validateReferences = async () => {
  const { repositoryId } = repositoryStore;
  if (!repositoryId) throw new Error('Repository not initialized!');
  const { activities, elements } = await api.validateReferences(repositoryId);
  errors.value = [];
  activities.forEach((it: any) => {
    errors.value.push({
      id: it.src.id,
      message: `
        ${it.src.data.name}
        "${schemaConfig.getLevel(it.src.type).label}" "${it.referenceName}"
        relationship does not exist anymore. Relationship needs to be removed.
        If related item removal is published, make sure to publish this
        item as well after the removal.`,
    });
  });
  elements.forEach((it: any) => {
    errors.value.push({
      link: `/repository/${repositoryId}/editor/${it.src.outlineActivity.id}?elementId=${it.src.uid}`,
      message: `
        "${$ceRegistry.get(it.src.type).name}" element relationship
        "${it.referenceName}" does not exist anymore. Relationship needs to be
        removed. If related element removal is published, make sure to
        publish this element as well.`,
    });
  });
  errorReport.value = { activities, elements };
};

const cleanupReferences = async () => {
  const { repositoryId } = repositoryStore;
  if (!repositoryId) throw new Error('Repository not initialized!');
  await api.cleanupReferences(repositoryId, errorReport.value);
  await validateReferences();
};

onMounted(() => {
  validateReferences();
});
</script>
