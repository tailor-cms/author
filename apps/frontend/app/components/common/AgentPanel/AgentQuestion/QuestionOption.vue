<template>
  <VListItem
    :active="isActive"
    :prepend-icon="isActive ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'"
    class="question-option"
    @click="$emit('pick')"
    @mouseenter="$emit('hover')"
  >
    <VListItemTitle class="option-label">{{ label }}</VListItemTitle>
    <VListItemSubtitle v-if="hint" class="option-hint">
      {{ hint }}
    </VListItemSubtitle>
  </VListItem>
</template>

<script lang="ts" setup>
defineProps<{
  label: string;
  isActive: boolean;
  hint?: string;
}>();
defineEmits<{ pick: []; hover: [] }>();
</script>

<style lang="scss" scoped>
.v-list-item-subtitle {
  -webkit-line-clamp: initial;
}
</style>
