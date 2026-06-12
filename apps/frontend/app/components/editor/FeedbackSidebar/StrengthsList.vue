<template>
  <div class="d-flex flex-column ga-2">
    <VCard
      v-for="(strength, index) in strengths"
      :key="index"
      class="d-flex ga-3 pa-3"
      color="surface-container-high"
      rounded="lg"
      flat
    >
      <VIcon class="mt-1" color="success" icon="mdi-check-circle" size="18" />
      <div>
        <div class="text-body-small font-weight-bold">
          {{ strength.title }}
        </div>
        <div class="text-body-small text-medium-emphasis">
          {{ strength.detail }}
        </div>
      </div>
    </VCard>
  </div>
</template>

<script lang="ts" setup>
import type { FeedbackStrength } from '@tailor-cms/interfaces/feedback';

defineProps<{
  strengths: FeedbackStrength[];
}>();
</script>
