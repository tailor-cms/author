<template>
  <VChip
    v-if="changeType"
    :color="chipColor"
    :text="changeType"
    class="diff-chip font-weight-semibold text-capitalize"
    density="comfortable"
    size="small"
    round
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
