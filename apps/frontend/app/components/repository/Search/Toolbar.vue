<template>
  <div class="d-flex align-center flex-wrap ga-4">
    <VTextField
      v-model="search"
      aria-label="Search content elements"
      bg-color="transparent"
      class="search-input"
      density="comfortable"
      maxlength="250"
      placeholder="Search content elements..."
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      variant="solo-filled"
      autofocus
      clearable
      flat
      hide-details
      @click:clear="search = ''"
    />
    <VAutocomplete
      v-model="types"
      :items="typeOptions"
      aria-label="Filter by element type"
      bg-color="transparent"
      class="type-filter"
      density="comfortable"
      placeholder="All element types"
      prepend-inner-icon="mdi-shape-outline"
      rounded="pill"
      variant="solo-filled"
      chips
      closable-chips
      clearable
      flat
      hide-details
      multiple
    >
      <template #chip="{ props: chipProps, item, index }">
        <VChip
          v-if="index < MAX_VISIBLE_TYPES"
          v-bind="chipProps"
          :prepend-icon="item.icon"
          :text="item.title"
          rounded="pill"
          size="small"
        />
        <span
          v-else-if="index === MAX_VISIBLE_TYPES"
          class="text-body-small text-medium-emphasis ms-1"
        >
          +{{ types.length - MAX_VISIBLE_TYPES }}
        </span>
      </template>
      <template #item="{ props: itemProps, item }">
        <VListItem v-bind="itemProps" :prepend-icon="item.icon" />
      </template>
    </VAutocomplete>
  </div>
</template>

<script lang="ts" setup>
interface TypeOption {
  title: string;
  value: string;
  icon?: string;
}

// Cap visible filter chips so the field stays one line
// the rest collapse into a `+N` count.
const MAX_VISIBLE_TYPES = 2;

defineProps<{ typeOptions: TypeOption[] }>();

const search = defineModel<string>('search', { default: '' });
const types = defineModel<string[]>('types', { default: () => [] });
</script>

<style lang="scss" scoped>
.search-input {
  flex: 1 1 18rem;
  max-width: 30rem;
}

.type-filter {
  flex: 1 1 16rem;
  max-width: 27rem;

  :deep(.v-field__input) {
    flex-wrap: nowrap;
    overflow: hidden;
  }
}
</style>
