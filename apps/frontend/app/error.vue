<template>
  <VApp class="bg-surface">
    <VContainer class="d-flex align-center justify-center fill-height pb-16">
      <VEmptyState
        :headline="content.headline"
        :title="content.title"
        :text="content.text"
        image="/img/logo-new.svg"
      >
        <template #actions>
          <VBtn
            prepend-icon="mdi-arrow-left"
            text="Back to the catalog"
            @click="handleError"
          />
        </template>
      </VEmptyState>
    </VContainer>
  </VApp>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps({
  error: Object as () => NuxtError,
});

const is404 = computed(() => props.error?.status === 404);
const content = computed(() => is404.value
  ? {
      headline: 'Whoops, 404',
      title: 'Page not found',
      text: 'The page you were looking for does not exist.',
    }
  : {
      headline: 'Whoops!',
      title: 'Something went wrong',
      text: props.error?.message || 'An unexpected error has occurred.',
    },
);

const handleError = () => clearError({ redirect: '/' });
</script>

<style lang="scss" scoped>
:deep(.v-empty-state__media) {
  padding-block: 2rem;
}
</style>
