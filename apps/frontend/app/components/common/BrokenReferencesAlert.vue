<template>
  <div v-show="errors.length">
    <VCard
      class="pa-4 text-left text-body-large"
      color="warning"
      icon="mdi-alert"
      variant="tonal"
    >
      <div class="d-flex align-center text-title-medium ml-2 mb-4">
        <VIcon icon="mdi-alert" class="mr-2" />
        Detected issues
        <VSpacer />
        <VBtn
          color="warning"
          prepend-icon="mdi-broom"
          size="small"
          variant="flat"
          text="Remove all broken references"
          @click="cleanupReferences"
        />
      </div>
      <div class="d-flex flex-column ga-4">
        <VCard
          v-for="({ id, link, message }, index) in errors"
          :key="index"
          class="pa-4 text-body-medium"
          variant="tonal"
        >
          {{ index + 1 }}. {{ message }}
          <a
            v-if="id"
            href="#"
            @click.stop="repositoryStore.selectActivity(id)"
          >
            Click to select the item.
          </a>
          <NuxtLink v-else-if="link" :to="link">
            Click to navigate to the item.
          </NuxtLink>
        </VCard>
      </div>
    </VCard>
  </div>
</template>

<script lang="ts" setup>
import { schema as schemaConfig } from '@tailor-cms/config';

import { api } from '@/api';
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
  if (!repositoryId) return;
  const { activities, elements } = await api.repository.validateReferences({
    params: { repositoryId },
  });
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
      // eslint-disable-next-line max-len
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
  await api.repository.cleanupReferences({
    params: { repositoryId },
    body: errorReport.value,
  });
  await validateReferences();
};

onMounted(() => {
  validateReferences();
});
</script>

<style lang="scss" scoped>
a {
  text-decoration: underline;
}
</style>
