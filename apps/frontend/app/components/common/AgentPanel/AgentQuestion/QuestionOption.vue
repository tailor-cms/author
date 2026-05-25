<template>
  <VListItem
    :active="isActive"
    active-color="primary"
    class="question-option"
    rounded="lg"
    @click="$emit('pick')"
    @mouseenter="$emit('hover')"
  >
    <template #prepend>
      <VIcon
        :color="radio.color"
        :icon="radio.icon"
        size="22"
      />
    </template>
    <VListItemTitle class="option-label">{{ label }}</VListItemTitle>
    <VListItemSubtitle v-if="hint" class="option-hint">
      {{ hint }}
    </VListItemSubtitle>
  </VListItem>
</template>

<script lang="ts" setup>
interface Props {
  label: string;
  isActive: boolean;
  hint?: string;
}

defineEmits<{ pick: []; hover: [] }>();

const props = defineProps<Props>();

const radio = computed(() => ({
  icon: props.isActive ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank',
  color: props.isActive ? 'primary' : 'medium-emphasis',
}));
</script>

<style lang="scss" scoped>
.question-option {
  margin-bottom: 0.25rem;
  text-align: left;

  :deep(.v-list-item__content) {
    padding-block: 0.375rem;
  }

  :deep(.v-list-item__prepend) {
    padding-inline-end: 0.75rem;
  }
}

.option-label {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.375;
}

.option-hint {
  margin-top: 0.125rem;
  opacity: 0.7 !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 0.75rem;
  line-height: 1.4;
}
</style>
