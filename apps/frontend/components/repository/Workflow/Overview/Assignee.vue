<template>
  <VTooltip location="top" open-delay="800">
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="column-assignee d-flex align-center">
        <AssigneeAvatar :img-url="imgUrl" :label="label" small start />
        <span class="text-truncate">{{ label }}</span>
      </div>
    </template>
    {{ label }}
  </VTooltip>
</template>

<script lang="ts" setup>
import AssigneeAvatar from '../AssigneeAvatar.vue';

interface Props {
  label?: string;
  imgUrl?: string;
}

withDefaults(defineProps<Props>(), {
  label: 'Unassigned',
  imgUrl: undefined,
});
</script>
