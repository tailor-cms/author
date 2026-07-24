<template>
  <VSheet
    class="text-center pa-8"
    color="transparent"
  >
    <VAvatar :color="color" size="x-large" variant="tonal">
      <VIcon :icon="icon" :size="isFocused ? 34 : 28" />
    </VAvatar>
    <div class="mt-4 mb-2 text-title-large">{{ name }}</div>
    <div v-if="!isDisabled" class="text-body-medium">
      <template v-if="!isFocused">{{ placeholder }}</template>
      <template v-else>
        {{ activePlaceholder }}
        <VIcon v-if="activeIcon" :icon="activeIcon" size="20" />
      </template>
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
interface Props {
  icon: string;
  name: string;
  color?: string;
  placeholder?: string;
  activePlaceholder?: string;
  activeIcon?: string | null;
  isFocused?: boolean;
  isDisabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  color: undefined,
  placeholder: 'Select to edit',
  activePlaceholder: 'Use toolbar to edit',
  activeIcon: null,
  isFocused: false,
  isDisabled: false,
});
</script>
