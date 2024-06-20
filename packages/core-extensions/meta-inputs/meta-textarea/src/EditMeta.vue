<template>
  <VTextarea
    v-model="input"
    :label="meta.label"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :rows="rows"
    class="my-2"
    variant="outlined"
    auto-grow
    @change="onChange"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits(['update']);
const props = defineProps({
  meta: { type: Object, default: () => ({ value: null }) },
  rows: { type: Number, default: 2 },
});

const input = ref(props.meta.value);

const onChange = () => {
  if (input.value === props.meta.value) return;
  emit('update', props.meta.key, input.value);
};
</script>
