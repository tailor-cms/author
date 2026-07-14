<template>
  <VNavigationDrawer
    width="74"
    class="workspace-rail"
    color="transparent"
    elevation="0"
    location="left"
    border="none"
    permanent
  >
    <div class="rail-tiles mt-2">
      <UserGroupAvatar
        v-for="item in items"
        :key="item.id"
        v-tooltip:end="{ text: item.name, openDelay: 300 }"
        :aria-label="item.name"
        :aria-pressed="item.id === selectedId"
        :class="['rail-avatar', { 'rail-avatar--active': item.id === selectedId }]"
        :logo-url="isAllOption(item) ? null : item.logoUrl"
        :placeholder-icon="isAllOption(item) ? 'mdi-view-grid-outline' : undefined"
        role="button"
        size="42"
        tabindex="0"
        rounded="xl"
        @click="selectedId = item.id"
        @keydown.enter="selectedId = item.id"
        @keydown.space.prevent="selectedId = item.id"
      />
      <VAvatar
        v-if="isCreateEnabled"
        v-tooltip:end="{ text: 'Create workspace', openDelay: 300 }"
        aria-label="Create workspace"
        class="rail-add mt-1"
        color="surface-container-high"
        role="button"
        rounded="xl"
        size="42"
        tabindex="0"
        @click="emit('create')"
        @keydown.enter="emit('create')"
        @keydown.space.prevent="emit('create')"
      >
        <VIcon color="primary" icon="mdi-plus" size="22" />
      </VAvatar>
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

interface WorkspaceOption {
  id: number;
  name: string;
  logoUrl?: string;
}

defineProps<{ items: WorkspaceOption[]; isCreateEnabled?: boolean }>();

const emit = defineEmits<{ create: [] }>();

const selectedId = defineModel<number | null>();

const isAllOption = (item: WorkspaceOption) => item.id === 0;
</script>

<style lang="scss" scoped>
.rail-tiles {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding-block: 0.25rem;
}

.rail-avatar {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  &--active {
    opacity: 1;
    box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
  }
}

.rail-add {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
}
</style>
