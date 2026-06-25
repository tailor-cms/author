<template>
  <VChip
    v-if="changeType"
    :color="chipColor"
    :variant="variant"
    class="readonly font-weight-medium text-capitalize"
    size="small"
    round
  >
    {{ changeType }}
  </VChip>
</template>

<script lang="ts" setup>
import { PublishDiffChangeTypes } from '@tailor-cms/utils';
import { computed } from 'vue';

// TODO: Update the type once utils is migrated to ts
interface Props {
  changeType?: PublishDiffChangeTypes | null;
  variant?: string;
}

const props = withDefaults(defineProps<Props>(), {
  changeType: null,
  variant: 'tonal',
});

const chipColor = computed(() => {
  if (props.changeType === PublishDiffChangeTypes.New) return 'success';
  if (props.changeType === PublishDiffChangeTypes.Changed) return 'warning';
  return 'error';
});
</script>
