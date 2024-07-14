<template>
  <VTooltip location="top" open-delay="800">
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="column-assignee d-flex align-center">
        <UserAvatar
          :img-url="imgUrl"
          color="primary-lighten-4"
          size="24"
          start
        />
        <span class="text-truncate">{{ label }}</span>
      </div>
    </template>
    {{ label }}
  </VTooltip>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components-next';

interface Props {
  label?: string;
  imgUrl?: string;
}

withDefaults(defineProps<Props>(), {
  label: 'Unassigned',
  imgUrl: undefined,
});
</script>
