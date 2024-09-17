<template>
  <div class="meta-inputs">
    <MetaInput
      v-for="input in inputs"
      :key="`${id}.${input.key}`"
      :meta="input"
      dark
      @update="updateElement"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getElementId } from '@tailor-cms/utils';
import type { Metadata } from '@tailor-cms/interfaces/schema';

import MetaInput from '@/components/common/MetaInput.vue';

interface Props {
  element: ContentElement;
  inputs?: Metadata[];
}

const props = withDefaults(defineProps<Props>(), {
  inputs: () => [],
});

const elementBus = inject('$elementBus') as any;
const id = computed(() => getElementId(props.element));

const updateElement = (key: string, value: Metadata) => {
  const meta = { ...props.element.meta };
  meta[key] = value;
  elementBus.emit('save:meta', meta);
};
</script>
