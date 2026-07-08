<template>
  <VCard
    :data-testid="`repositoryCard_${repository.id}`"
    :ripple="false"
    :class="{ selected: isSelected }"
    class="repository-card d-flex flex-column text-left"
    rounded="xl"
    elevation="0"
    color="surface-container-low"
    @click="navigateTo({ name: 'repository', params: { id: repository.id } })"
  >
    <div class="card-body">
      <div class="card-header d-flex align-center mt-4 mx-4 mb-1">
        <div
          :aria-checked="isSelected"
          :class="{ 'is-selected': isSelected }"
          aria-label="Select repository"
          class="select-checkbox d-flex align-center"
          role="checkbox"
          tabindex="0"
          @click.stop="$emit('toggle-selection', repository.id)"
          @keydown.enter.prevent="$emit('toggle-selection', repository.id)"
          @keydown.space.prevent="$emit('toggle-selection', repository.id)"
        >
          <VIcon
            :color="isSelected ? 'primary' : undefined"
            :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
            size="24"
          />
        </div>
        <div
          ref="schema"
          v-tooltip="{
            disabled: !isSchemaNameTruncated,
            text: schemaName,
            openDelay: 300,
          }"
          class="schema-name flex-grow-1 mr-2 text-truncate text-uppercase"
        >
          {{ schemaName }}
        </div>
        <VBadge
          v-tooltip:top="{ text: publishingInfo, openDelay: 100 }"
          :aria-label="hasUnpublishedChanges ? 'Has unpublished changes' : 'Published'"
          :color="hasUnpublishedChanges ? 'warning' : 'success'"
          class="mr-2"
          dot
          inline
        />
        <VMenu v-if="repository?.hasAdminAccess" location="bottom end" offset="4">
          <template #activator="{ props: menuProps }">
            <VBtn
              v-tooltip:top="{ text: 'Repository actions', openDelay: 400 }"
              v-bind="menuProps"
              aria-label="Repository actions"
              class="repo-info text-medium-emphasis"
              density="comfortable"
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              @click.stop
            />
          </template>
          <VList density="compact" min-width="200" nav>
            <VListItem
              v-for="action in actions"
              :key="action.name"
              :base-color="action.color"
              :prepend-icon="`mdi-${action.icon}`"
              :title="action.label"
              rounded="lg"
              @click.stop="onAction(action.name)"
            />
          </VList>
        </VMenu>
      </div>
      <VCardTitle class="pt-0 text-break">
        {{ truncate(repository.name, { length: lgAndUp ? 60 : 40 }) }}
      </VCardTitle>
      <div class="d-flex justify-start px-4">
        <UserAvatar :img-url="lastActivity.user.imgUrl" :size="38" />
        <div class="ml-3 overflow-hidden">
          <div class="text-body-small">Edited {{ lastActivityTimeago }} by</div>
          <div class="text-body-medium text-truncate">
            {{ lastActivity.user.label }}
          </div>
        </div>
      </div>
    </div>
    <VSpacer />
    <VCardActions class="pb-2 px-2 align-start">
      <VBtn
        v-tooltip:bottom="{
          text: `${isPinned ? 'Unpin' : 'Pin'} ${schemaName}`,
          openDelay: 400,
        }"
        :color="isPinned ? 'tertiary' : ''"
        :icon="isPinned ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
        class="text-medium-emphasis"
        aria-label="Pin repository"
        @click.stop="store.pin({ id: repository.id, pin: !isPinned })"
      />
      <Tags :repository="repository" />
    </VCardActions>
  </VCard>
</template>

<script lang="ts" setup>
import { first, get, truncate } from 'lodash-es';
import type { Repository } from '@tailor-cms/interfaces/repository';
import type { Revision } from '@tailor-cms/interfaces/revision';
import { useDisplay } from 'vuetify';
import { UserAvatar } from '@tailor-cms/core-components';
import { useTimeAgo } from '@vueuse/core';

import Tags from './Tags/index.vue';
import { useRepositoryStore } from '@/stores/repository';

const { $schemaService } = useNuxtApp() as any;
const store = useRepositoryStore();

const props = defineProps<{
  repository: Repository;
  isSelected?: boolean;
}>();
const emit = defineEmits([
  'toggle-selection',
  'clone',
  'publish',
  'export',
  'delete',
]);

interface CardAction {
  name: 'settings' | 'clone' | 'publish' | 'export' | 'delete';
  label: string;
  icon: string;
  color?: string;
}

const actions = computed<CardAction[]>(() => [
  { name: 'settings', label: 'Settings', icon: 'cog-outline' },
  { name: 'clone', label: 'Clone', icon: 'content-copy' },
  { name: 'publish', label: 'Publish', icon: 'cloud-upload-outline' },
  { name: 'export', label: 'Export', icon: 'archive-arrow-down-outline' },
  { name: 'delete', label: 'Delete', icon: 'trash-can-outline', color: 'error' },
]);

const onAction = (name: CardAction['name']) => {
  if (name === 'settings') {
    return navigateTo({
      name: 'repository-settings-general',
      params: { id: props.repository.id },
    });
  }
  emit(name, props.repository);
};

// Template ref
const schema = ref(null);

const isSchemaNameTruncated = ref(false);
const schemaName = computed(
  () => $schemaService.getSchema(props.repository.schema).name,
);

const lastActivity = computed(
  () => first(props.repository.revisions) as Revision,
) as ComputedRef<Revision>;
const lastActivityTimeago = useTimeAgo(lastActivity.value.createdAt);

const isPinned = computed(() =>
  get(props.repository, 'repositoryUser.pinned', false),
);

const hasUnpublishedChanges = computed(() => props.repository.hasUnpublishedChanges);

const publishingInfo = computed(() => hasUnpublishedChanges.value
  ? 'Has unpublished changes.'
  : 'Published.',
);

const detectSchemaTruncation = () => {
  const { clientWidth, scrollWidth } = schema.value as any;
  isSchemaNameTruncated.value = clientWidth < scrollWidth;
};

const { width: innerWidth, lgAndUp } = useDisplay();
watch(() => innerWidth.value, detectSchemaTruncation);

onMounted(() => nextTick(detectSchemaTruncation));
</script>

<style lang="scss" scoped>
.repository-card {
  height: 12.75rem;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
  }
}

.card-body {
  .schema-name {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 1px;
  }

  .v-avatar {
    margin-top: 0.125rem;
  }
}

.v-card:hover > :deep(.v-card__overlay) {
  opacity: 0.01;
}

.repository-card.selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.select-checkbox {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  cursor: pointer;
  border-radius: 4px;
  transition:
    max-width 0.3s ease,
    opacity 0.3s ease,
    margin-right 0.3s ease;

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}

.repository-card:hover .select-checkbox,
.select-checkbox:focus-visible,
.select-checkbox.is-selected {
  max-width: 1.75rem;
  opacity: 1;
  margin-right: 0.5rem;
}

.repository-card:hover .select-checkbox {
  transition-delay: 150ms;
}
</style>
