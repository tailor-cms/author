<template>
  <VMenu :content-class="contentClass" :z-index="9100" location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        :aria-label="label"
        :prepend-icon="activeOption!.icon"
        :text="activeOption!.title"
        color="secondary"
        class="agent-option-menu"
        append-icon="mdi-chevron-down"
        rounded="lg"
        size="small"
        variant="tonal"
      />
    </template>
    <VList nav>
      <VListItem
        v-for="option in options"
        :key="option.value"
        :active="option.value === model"
        :prepend-icon="option.icon"
        :subtitle="option.subtitle"
        :title="option.title"
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
}>();

const model = defineModel<T>({ required: true });

const activeOption = computed(() =>
  props.options.find((option) => option.value === model.value),
);
</script>
