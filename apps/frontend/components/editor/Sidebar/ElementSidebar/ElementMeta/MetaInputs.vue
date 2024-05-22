<template>
  <div class="meta-inputs">
    <MetaInput
      v-for="input in inputs"
      :key="`${id}.${input.key}`"
      :meta="input"
      @update="updateElement"
    />
  </div>
</template>

<script lang="ts" setup>
import { getElementId } from '@tailor-cms/utils';

import MetaInput from '@/components/common/MetaInput.vue';

const props = defineProps({
  element: { type: Object, required: true },
  inputs: { type: Array, default: () => [] },
});

const elementBus = inject('$elementBus') as any;
const id = computed(() => getElementId(props.element));

const updateElement = (key, value) => {
  const meta = { ...props.element.meta };
  meta[key] = value;
  elementBus.emit('save:meta', meta);
};
</script>
