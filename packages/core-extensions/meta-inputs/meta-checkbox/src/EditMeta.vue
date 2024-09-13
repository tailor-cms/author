<template>
  <div>
    <div v-if="meta.label" class="control-label">{{ meta.label }}</div>
    <VCheckbox
      v-model="input"
      :label="meta.description"
      :name="meta.key"
      color="primary-darken-2"
      @change="$emit('update', props.meta.key, input)"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  meta?: any;
}

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
});
defineEmits(['update']);

const input = ref(props.meta.value);
</script>

<style lang="scss" scoped>
.control-label {
  font-size: 0.875rem;
  color: #0000008a;
}
</style>
