<template>
  <div class="user-group-list d-flex flex-column h-100 text-left">
    <div class="px-4 pt-4 pb-2">
      <div class="d-flex align-center ga-1 mb-3">
        <h2 class="text-title-medium font-weight-bold">User groups</h2>
        <VSpacer />
        <VBtn
          v-if="canCreate"
          v-tooltip:bottom="'Add user group'"
          aria-label="Add user group"
          density="comfortable"
          icon="mdi-plus"
          size="small"
          variant="text"
          @click="emit('create:group')"
        />
        <VBtn
          v-tooltip:bottom="{ text: 'Collapse sidebar', openDelay: 500 }"
          aria-label="Collapse sidebar"
          class="collapse-btn ml-1"
          density="comfortable"
          icon="mdi-chevron-double-left"
          size="small"
          variant="tonal"
          @click="emit('collapse')"
        />
      </div>
      <div class="d-flex align-center ga-1">
        <VTextField
          v-model="search"
          bg-color="surface-container"
          data-testid="search-user-groups"
          density="compact"
          placeholder="Search user groups..."
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          variant="solo"
          clearable
          flat
          hide-details
        />
        <VBtn
          v-tooltip:bottom="{
            text: sortOrder === 'desc' ? 'Name (Z–A)' : 'Name (A–Z)',
            openDelay: 500,
          }"
          :icon="sortIcon"
          aria-label="Toggle sort order"
          class="text-medium-emphasis"
          density="comfortable"
          size="small"
          variant="text"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
        />
      </div>
    </div>
    <div class="flex-grow-1 overflow-y-auto pa-2">
      <VList
        v-if="items.length"
        bg-color="transparent"
        class="user-group-entries pa-0"
        nav
      >
        <UserGroupListItem
          v-for="group in items"
          :key="group.id"
          :group="group"
          :has-actions="hasActions"
          :is-selected="group.id === selectedId"
          @delete:group="emit('delete:group', $event)"
          @edit:group="emit('edit:group', $event)"
          @select="emit('select', $event)"
        />
      </VList>
      <p
        v-else-if="!isLoading"
        class="text-body-medium text-medium-emphasis pa-2"
      >
        {{ search ? 'No user groups match your search.' : 'No user groups yet.' }}
      </p>
      <VBtn
        v-if="hasMore"
        :loading="isLoading"
        class="mt-1"
        text="Show more"
        variant="text"
        block
        @click="emit('load:more')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { UserGroupRow } from './types';
import UserGroupListItem from './UserGroupListItem.vue';

defineProps<{
  items: UserGroupRow[];
  selectedId: number | null;
  isLoading: boolean;
  hasActions: boolean;
  hasMore: boolean;
  canCreate: boolean;
}>();

const emit = defineEmits<{
  'collapse': [];
  'create:group': [];
  'delete:group': [group: UserGroupRow];
  'edit:group': [group: UserGroupRow];
  'load:more': [];
  'select': [id: number];
}>();

const search = defineModel<string>('search', { required: true });
const sortOrder = defineModel<'asc' | 'desc'>('sortOrder', {
  required: true,
});

const sortIcon = computed(() => sortOrder.value === 'desc'
  ? 'mdi-sort-alphabetical-descending'
  : 'mdi-sort-alphabetical-ascending',
);
</script>

<style lang="scss" scoped>
.collapse-btn {
  opacity: 0.7;
  transition: opacity 160ms ease;

  &:hover {
    opacity: 1;
  }
}
</style>
