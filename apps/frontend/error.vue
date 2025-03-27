<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps({
  error: Object as () => NuxtError,
});

const is404 = computed(() => props.error?.statusCode === 404);
const headline = computed(() =>
  is404.value ? 'looks like that Page has been ✂ 😉' : 'an error has occured!',
);
const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <VApp class="bg-primary-darken-3">
    <VContainer class="mt-15">
      <div class="d-flex flex-column align-center justify-center h-100">
        <VEmptyState
          :headline="`Whooops, ${headline}`"
          image="/img/default-logo-compact.svg"
        />
        <VBtn
          color="primary-darken-4"
          prepend-icon="mdi-arrow-left"
          @click="handleError"
        >
          Back to the catalog
        </VBtn>
      </div>
    </VContainer>
  </VApp>
</template>

<style lang="scss" scoped>
:deep(.v-empty-state__headline) {
  margin: 4rem 0 2rem;
  font-size: 2.5rem;
  color: rgb(var(--v-theme-primary-lighten-5));
}
</style>
