<template>
  <VSheet
    :class="dense ? 'pt-3' : 'pa-12'"
    class="text-center"
    color="transparent"
  >
    <VAvatar color="inverse-surface" :size="dense ? 40 : 60">
      <VIcon
        :color="isFocused ? activeColor : ''"
        :icon="icon"
        :size="iconSize"
      />
    </VAvatar>
    <div :class="[dense ? 'my-2 text-title-small' : 'my-4 text-headline-small']">
      {{ name }}
    </div>
    <div v-if="!dense && !isDisabled" class="text-body-large">
      <template v-if="!isFocused">{{ placeholder }}</template>
      <template v-else>
        {{ activePlaceholder }}
        <VIcon v-if="activeIcon" :icon="activeIcon" size="20" />
      </template>
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  icon: string;
  name: string;
  placeholder?: string;
  activePlaceholder?: string;
  activeIcon?: string | null;
  activeColor?: string;
  dense?: boolean;
  isFocused?: boolean;
  isDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select to edit',
  activePlaceholder: 'Use toolbar to edit',
  activeIcon: null,
  activeColor: '#fff',
  dense: false,
  isFocused: false,
  isDisabled: false,
});

const iconSize = computed(() => {
  if (props.dense) return props.isFocused ? 24 : 20;
  return props.isFocused ? 38 : 30;
});
</script>
