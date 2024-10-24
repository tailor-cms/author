<template>
  <VChip
    v-if="changeType"
    :color="changeType === 'new' ? 'success' : 'secondary'"
    class="readonly font-weight-medium text-capitalize"
    size="small"
    round
  >
    {{ changeType }}
  </VChip>
</template>

<script lang="ts" setup>
// TODO: Update the type once utils is migrated to ts
withDefaults(defineProps<{ changeType?: string | null }>(), {
  changeType: null,
});
</script>
