<template>
  <VSelect
    v-bind="$attrs"
    :items="priorities"
    :model-value="selected"
    item-title="label"
    item-value="id"
    label="Priority"
    variant="outlined"
  >
    <template #selection="{ item }">
      <VIcon :color="item.raw.color" :icon="item.raw.icon" class="mr-4" />
      {{ item.title }}
    </template>
    <template #item="{ item, props: selectionProps }">
      <VListItem v-bind="selectionProps" slim>
        <template #prepend>
          <VIcon :color="item.raw.color" :icon="item.raw.icon" />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>

<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue';
import { workflow as workflowConfig } from 'tailor-config-shared';

const props = defineProps<{
  modelValue: string | null;
}>();

const priorities = ref(workflowConfig.priorities);
const selected = computed(() =>
  priorities.value.find((it) => it.id === props.modelValue),
);
</script>

<style lang="scss" scoped>
.icon {
  width: 1rem;
}
</style>
