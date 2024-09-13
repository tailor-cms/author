<template>
  <div class="control">
    <div v-if="meta.label" class="control-label">{{ meta.label }}</div>
    <VCheckbox
      :input-value="meta.value"
      :label="meta.description"
      :name="meta.key"
      class="mt-1"
      color="primary darken-2"
      @change="$emit('update', meta.key, $event)"
    />
  </div>
</template>

<script lang="ts" setup>
interface Props {
  meta?: any;
}

withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
});
defineEmits(['update']);
</script>

<style lang="scss" scoped>
.control {
  padding: 3px 8px;

  ::v-deep label.v-label {
    margin-bottom: 0;
  }

  &-label {
    font-size: 0.875rem;
    font-weight: normal;
    text-align: left;
    color: #0000008a;
  }
}
</style>
