<template>
  <VTextarea
    v-model="input"
    :label="meta.label"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :rows="meta.rows"
    class="my-2"
    variant="outlined"
    auto-grow
    @change="onChange"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  meta?: any;
}

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null, rows: 2 }),
});
const emit = defineEmits(['update']);

const input = ref(props.meta.value);

const onChange = () => {
  if (input.value === props.meta.value) return;
  emit('update', props.meta.key, input.value);
};
</script>
