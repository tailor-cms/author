<template>
  <VSheet
    :class="dense ? 'pt-3' : 'pa-12'"
    class="text-center text-grey"
    color="transparent"
  >
    <VAvatar
      :color="isDisabled ? 'primary-darken-3' : 'primary-darken-4'"
      :size="dense ? 40 : 60"
    >
      <VIcon
        :color="isFocused ? activeColor : 'white'"
        :icon="icon"
        :size="iconSize"
      />
    </VAvatar>
    <div
      :class="[
        isDisabled ? 'text-grey-darken-3' : 'text-grey-darken-4',
        dense ? 'my-2 text-subtitle-2' : 'my-4 text-h5',
      ]"
    >
      {{ name }}
    </div>
    <div
      v-if="!dense && !isDisabled"
      class="text-grey-darken-2 text-subtitle-1"
    >
      <template v-if="!isFocused">{{ placeholder }}</template>
      <template v-else>
        {{ activePlaceholder }}
        <VIcon
          v-if="activeIcon"
          :icon="activeIcon"
          color="primary-darken-4"
          size="20"
        />
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
