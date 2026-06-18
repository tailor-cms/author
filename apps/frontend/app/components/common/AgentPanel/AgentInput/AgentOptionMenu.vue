<template>
  <VMenu :content-class="contentClass" :z-index="9100" location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-if="compact"
        v-tooltip:top="{ text: label, openDelay: 500 }"
        v-bind="menuProps"
        :aria-label="label"
        :icon="activeOption!.icon"
        class="agent-option-menu"
        density="comfortable"
        rounded="lg"
        size="small"
        variant="tonal"
      />
      <VBtn
        v-else
        v-bind="menuProps"
        :aria-label="label"
        :prepend-icon="activeOption!.icon"
        :text="activeOption!.title"
        class="agent-option-menu"
        append-icon="mdi-chevron-down"
        rounded="lg"
        size="small"
        variant="tonal"
      />
    </template>
    <VList max-width="260" nav>
      <VListItem
        v-for="option in options"
        :key="option.value"
        :active="option.value === model"
        :prepend-icon="option.icon"
        :subtitle="option.subtitle"
        :title="option.title"
        class="py-2"
        @click="model = option.value"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup generic="T extends string">
interface OptionMenuItem {
  title: string;
  value: T;
  icon: string;
  subtitle: string;
}

const props = defineProps<{
  options: OptionMenuItem[];
  label: string;
  contentClass?: string;
  compact?: boolean;
}>();

const model = defineModel<T>({ required: true });

const activeOption = computed(() =>
  props.options.find((option) => option.value === model.value),
);
</script>

<style lang="scss" scoped>
:deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
}
</style>
