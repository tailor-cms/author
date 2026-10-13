<template>
  <div class="typing-indicator text-body-small text-medium-emphasis">
    <VFadeTransition>
      <span v-if="label">{{ label }}</span>
    </VFadeTransition>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ users: { label: string }[] }>();

const label = computed(() => {
  const [first, ...others] = props.users;
  if (!first) return '';
  if (!others.length) return `${first.label} is typing...`;
  return 'Several people are typing...';
});
</script>

<style lang="scss" scoped>
.typing-indicator {
  height: 1.25rem;
}
</style>
