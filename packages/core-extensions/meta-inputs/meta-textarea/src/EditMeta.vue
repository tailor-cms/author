<template>
  <VTextarea
    v-model="input"
    :label="meta.label"
    :name="meta.key"
    :placeholder="meta.placeholder"
    :rows="meta.rows || 2"
    class="my-2"
    variant="outlined"
    auto-grow
    @change="onChange"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

interface Props {
  meta?: any;
}

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
});
const emit = defineEmits(['update']);

const input = ref(props.meta.value);

const onChange = () => {
  if (input.value === props.meta.value) return;
  emit('update', props.meta.key, input.value);
};

watch(() => props.meta.value, (val) => {
  input.value = val;
});
</script>
