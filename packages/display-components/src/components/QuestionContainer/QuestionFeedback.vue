<template>
  <VAlert
    v-bind="alertProps"
    class="mb-3"
    rounded="lg"
    variant="tonal"
    border>
    <div
      v-if="!!Object.keys(feedback).length"
      class="d-flex flex-column ga-2 mt-4"
    >
      <VCard v-for="(it, key) in feedback" :key="key" variant="tonal" rounded>
        <VCardText class="d-flex">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="feedback" v-html="it"></div>
        </VCardText>
      </VCard>
    </div>
  </VAlert>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  feedback: any;
  isGraded: boolean;
  isCorrect: any;
}>();

const alertProps = computed(() => {
  if (!props.isGraded) return { title: 'Submitted', type: 'info' };
  if (props.isCorrect) return { title: 'Correct', type: 'success' };
  return { title: 'Incorrect', type: 'error' };
});
</script>

<style lang="scss" scoped>
:deep(.feedback) {
  width: 100%;

  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  pre {
    background: #0d0d0d;
    white-space: break-spaces;
    color: #fff;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid color-mix(in srgb, currentColor 20%, transparent);
  }
}
</style>
