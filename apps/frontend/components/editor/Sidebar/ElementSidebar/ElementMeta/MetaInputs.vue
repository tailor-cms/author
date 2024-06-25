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
import type { ContentElement } from 'tailor-interfaces/content-element';
import { getElementId } from '@tailor-cms/utils';
import type { Meta } from 'tailor-interfaces/common';

import MetaInput from '@/components/common/MetaInput.vue';

interface Props {
  element: ContentElement;
  inputs?: Meta[];
}

const props = withDefaults(defineProps<Props>(), {
  inputs: () => [],
});

const elementBus = inject('$elementBus') as any;
const id = computed(() => getElementId(props.element));

const updateElement = (key: string, value: Meta) => {
  const meta = { ...props.element.meta };
  meta[key] = value;
  elementBus.emit('save:meta', meta);
};
</script>
