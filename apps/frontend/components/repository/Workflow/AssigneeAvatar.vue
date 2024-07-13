<template>
  <VTooltip :disabled="!showTooltip" location="bottom" open-delay="500">
    <template #activator="{ props: tooltipProps }">
      <VAvatar
        v-bind="{ ...tooltipProps, ...$attrs }"
        :size="small ? 24 : 34"
        color="primary-lighten-4"
      >
        <VImg v-if="imgUrl" :src="imgUrl" />
        <VIcon
          v-else
          :size="small ? 16 : 24"
          color="primary-darken-3"
          icon="mdi-account"
        />
      </VAvatar>
    </template>
    <span>{{ label }}</span>
  </VTooltip>
</template>

<script lang="ts" setup>
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
