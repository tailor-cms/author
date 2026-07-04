<template>
  <VMenu v-model="isOpen" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <VChip
        v-bind="{ ...menuProps, ...$attrs }"
        :color="model.length ? 'tertiary' : ''"
        class="pr-2"
        rounded="lg"
        variant="tonal"
      >
        {{ label }}
        <template #append>
          <VBadge
            v-if="model.length"
            :content="model.length"
            class="count-badge ml-1"
            color="tertiary"
            inline
          />
          <VIcon v-else class="ml-1" icon="mdi-chevron-down" />
        </template>
      </VChip>
    </template>
    <VList density="compact" min-width="200" nav>
      <VListItem
        v-for="option in items"
        :key="option.id"
        :active="isSelected(option.id)"
        @click="toggle(option.id)"
      >
        <template #prepend>
          <VListItemAction start>
            <VCheckboxBtn :model-value="isSelected(option.id)" />
          </VListItemAction>
          <VIcon
            :color="option.color"
            :icon="option.icon ?? 'mdi-circle'"
            size="small"
          />
        </template>
        <VListItemTitle>{{ option.label }}</VListItemTitle>
      </VListItem>
      <template v-if="model.length">
        <VListItem prepend-icon="mdi-filter-remove" @click="clear">
          <VListItemTitle>Clear</VListItemTitle>
        </VListItem>
      </template>
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import { xor } from 'lodash-es';

interface Item {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

defineOptions({ inheritAttrs: false });

defineProps<{
  label: string;
  items: Item[];
}>();

const model = defineModel<string[]>({ default: () => [] });

const isOpen = ref(false);

const isSelected = (id: string) => model.value.includes(id);
const toggle = (id: string) => (model.value = xor(model.value, [id]));

// Toggles compose a selection, so the menu stays open; clearing is terminal,
// so it dismisses the menu too.
const clear = () => {
  model.value = [];
  isOpen.value = false;
};
</script>

<style lang="scss" scoped>
// VBadge has no size/density props; its dimensions are fixed CSS.
.count-badge :deep(.v-badge__badge) {
  height: 1rem;
  min-width: 1rem;
  padding: 2px 4px;
  font-weight: bold;
  font-size: 0.75rem;
}
</style>
