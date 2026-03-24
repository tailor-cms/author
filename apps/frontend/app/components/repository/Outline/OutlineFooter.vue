<template>
  <VRow>
    <VCol class="text-left">
      <VAlert
        v-if="!anchor"
        class="mb-5"
        color="primary-lighten-3"
        icon="mdi-information-outline"
        variant="tonal"
        prominent
      >
        Click on the button below in order to create your first item!
      </VAlert>
      <div class="d-flex ga-2">
        <CreateDialog
          :anchor="anchor"
          :repository-id="repositoryId as number"
          activator-color="primary-lighten-3"
          test-id-prefix="repository__createRootActivity"
          show-activator
        />
        <LinkContent :anchor="anchor" show-activator />
      </div>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import { last } from 'lodash-es';
import { storeToRefs } from 'pinia';

import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import LinkContent from '@/components/repository/Library/LinkContent.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const store = useCurrentRepository();
const { repositoryId, rootActivities } = storeToRefs(store);
const anchor = computed(() => last(rootActivities.value));
</script>
