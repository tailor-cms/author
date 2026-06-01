<template>
  <VListItem
    :active="isActive"
    :prepend-icon="radio.icon"
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
