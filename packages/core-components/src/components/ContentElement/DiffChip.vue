<template>
  <VChip
    v-if="changeType"
    :color="chipColor"
    :text="changeType"
    class="diff-chip"
    density="comfortable"
    rounded="md"
    size="small"
  />
</template>

<script lang="ts" setup>
import { DiffChangeTypes } from '@tailor-cms/interfaces/content-element';
import { computed } from 'vue';

interface Props {
  changeType?: DiffChangeTypes | null;
}

const props = withDefaults(defineProps<Props>(), {
  changeType: null,
});

const chipColor = computed(() => {
  if (props.changeType === DiffChangeTypes.New) return 'success';
  if (props.changeType === DiffChangeTypes.Changed) return 'warning';
  return 'error';
});
</script>

<style scoped lang="scss">
.diff-chip {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.0625em;
  flex-shrink: 0;
}
</style>
