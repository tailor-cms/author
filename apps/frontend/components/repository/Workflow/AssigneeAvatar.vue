<template>
  <VTooltip :disabled="!showTooltip" location="bottom" open-delay="500">
    <template #activator="{ props: tooltipProps }">
      <UserAvatar
        v-bind="{ ...tooltipProps, ...$attrs }"
        :img-url="imgUrl"
        :size="small ? 24 : 34"
        color="primary-lighten-4"
      />
    </template>
    <span>{{ label }}</span>
  </VTooltip>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components-next';

interface Props {
  imgUrl?: string;
  label?: string;
  small?: boolean;
  showTooltip?: boolean;
}

withDefaults(defineProps<Props>(), {
  label: 'Unassigned',
  imgUrl: undefined,
  small: false,
  showTooltip: false,
});
</script>
