<template>
  <VAlert :color="alertProps.color" variant="tonal">
    <div class="d-flex align-center">
      <VIcon :icon="alertProps.icon" class="mr-2" size="small" />
      <span class="text-subtitle-1">{{ alertProps.text }}</span>
    </div>
    <div v-if="hasFeedback" class="d-flex flex-column ga-2 mt-4">
      <VCard v-for="(it, key) in feedback" :key="key" variant="tonal">
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

const hasFeedback = computed(
  () => props.feedback && Object.keys(props.feedback).length,
);

const alertProps = computed(() => {
  if (!props.isGraded) {
    return { text: 'Submitted', color: 'info', icon: 'mdi-information' };
  }
  if (props.isCorrect) {
    return { text: 'Correct', color: 'success', icon: 'mdi-check-circle' };
  }
  return { text: 'Incorrect', color: 'error', icon: 'mdi-close-circle' };
});
</script>

<style lang="scss" scoped>
.text-subtitle-1 {
  line-height: 1;
  font-weight: bold;
}

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
    border-left: 2px solid color-mix(in srgb, currentColor 36%, transparent);
  }
}
</style>
