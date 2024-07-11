<template>
  <VTooltip open-delay="800" bottom>
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="column-assignee d-flex align-center">
        <AssigneeAvatar :img-url="imgUrl" :label="label" class="mr-2" small />
        <span class="text-truncate">{{ label }}</span>
      </div>
    </template>
    {{ label }}
  </VTooltip>
</template>

<script lang="ts" setup>
import AssigneeAvatar from '../AssigneeAvatar.vue';

defineProps({
  label: { type: String, default: 'Unassigned' },
  imgUrl: { type: String, default: null },
});
</script>
