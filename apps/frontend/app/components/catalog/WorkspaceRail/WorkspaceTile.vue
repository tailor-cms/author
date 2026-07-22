<template>
  <div :class="['workspace-tile', { 'workspace-tile--active': isActive }]">
    <VBtn
      v-tooltip:end="{ text: item.name, openDelay: 300 }"
      :aria-label="item.name"
      :aria-pressed="isActive"
      class="tile-avatar"
      size="40"
      flat
      icon
      @click="emit('select')"
    >
      <UserGroupAvatar
        :logo-url="isAll ? null : item.logoUrl"
        :placeholder-icon="isAll ? 'mdi-view-grid-outline' : undefined"
        rounded="xl"
        size="40"
      />
    </VBtn>
    <VMenu v-if="canManage && !isAll" location="end" offset="4">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          aria-label="Workspace actions"
          class="tile-kebab"
          color="primary"
          density="comfortable"
          icon="mdi-dots-vertical"
          size="x-small"
        />
      </template>
      <VList density="compact" min-width="180" nav>
        <VListSubheader class="text-truncate">{{ item.name }}</VListSubheader>
        <VListItem
          append-icon="mdi-arrow-right"
          prepend-icon="mdi-account-cog"
          title="Manage"
          :to="{ name: 'user-group', params: { userGroupId: item.id } }"
        />
        <template v-if="canModify">
          <VListItem
            prepend-icon="mdi-square-edit-outline"
            title="Edit"
            @click="emit('edit')"
          />
          <VListItem
            base-color="error"
            prepend-icon="mdi-trash-can-outline"
            title="Delete"
            @click="emit('delete')"
          />
        </template>
      </VList>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

export interface WorkspaceOption {
  id: number;
  name: string;
  logoUrl?: string | null;
}

const props = defineProps<{
  item: WorkspaceOption;
  isActive?: boolean;
  canManage?: boolean;
  canModify?: boolean;
}>();

const emit = defineEmits<{ select: []; edit: []; delete: [] }>();

const isAll = computed(() => props.item.id === 0);
</script>

<style lang="scss" scoped>
.workspace-tile {
  position: relative;
  display: flex;
}

.tile-avatar {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  .workspace-tile:hover &,
  .workspace-tile:focus-within & {
    opacity: 1;
  }

  .workspace-tile:hover & {
    transform: scale(1.05);
  }

  .workspace-tile--active & {
    opacity: 1;
    box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
  }
}

.tile-kebab {
  position: absolute;
  top: -0.375rem;
  right: -0.375rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  visibility: hidden;
  opacity: 0;
  transform: scale(0.5);
  transition:
    opacity 0.28s ease-in-out,
    transform 0.28s ease-in-out,
    visibility 0s linear 0.28s;

  .workspace-tile:hover &,
  .workspace-tile:has(:focus-visible) &,
  &[aria-expanded='true'] {
    visibility: visible;
    opacity: 1;
    transform: scale(1);
    // Cancel the visibility hold so the reveal starts immediately.
    transition-delay: 0s;
  }
}
</style>
