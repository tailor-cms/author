<template>
  <VCard
    :data-testid="`repositoryCard_${repository.id}`"
    :ripple="false"
    :class="{ selected: isSelected }"
    class="repository-card d-flex flex-column text-left"
    rounded="xl"
    color="surface-raised"
    elevation="2"
    @click="navigateTo({ name: 'repository', params: { id: repository.id } })"
  >
    <!-- Poster artwork: sharp on the right, dissolving into the card surface on
         the left via a theme-aware scrim + horizontal progressive blur -->
    <div v-if="thumbnailUrl" aria-hidden="true" class="card-bg">
      <img :src="thumbnailUrl" alt="" class="card-underlay" loading="lazy" />
      <img :src="thumbnailUrl" alt="" class="card-cover" loading="lazy" />
      <div class="card-scrim" />
      <div class="card-blur card-blur--1" />
      <div class="card-blur card-blur--2" />
      <div class="card-blur card-blur--3" />
    </div>
    <div class="card-body">
      <div class="card-header d-flex align-center mt-4 mx-4 mb-1">
        <div
          :aria-checked="isSelected"
          :class="{ 'is-selected': isSelected }"
          aria-label="Select repository"
          class="select-checkbox d-flex align-center justify-center"
          role="checkbox"
          tabindex="0"
          @click.stop="$emit('toggle-selection', repository.id)"
          @keydown.enter.prevent="$emit('toggle-selection', repository.id)"
          @keydown.space.prevent="$emit('toggle-selection', repository.id)"
        >
          <VIcon
            v-tooltip:top="{ text: publishingInfo, openDelay: 100 }"
            :aria-label="hasUnpublishedChanges ? 'Has unpublished changes' : 'Published'"
            :color="hasUnpublishedChanges ? 'warning' : 'success'"
            class="status-dot"
            icon="mdi-circle"
            size="14"
          />
          <VIcon
            :color="isSelected ? 'primary' : undefined"
            :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
            class="checkbox"
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
        <div
          v-if="repository?.hasAdminAccess"
          class="glass glass-pill d-flex align-center"
        >
          <VBtn
            v-tooltip:top="{ text: 'Open settings', openDelay: 400 }"
            aria-label="Repository settings"
            class="repo-info text-medium-emphasis"
            density="comfortable"
            icon="mdi-cog"
            size="small"
            variant="text"
            @click.stop="navigateTo({
              name: 'repository-settings-general',
              params: { id: repository.id },
            })"
          />
          <VMenu location="bottom end" offset="4">
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
      </div>
      <VCardTitle class="pt-0 text-break font-weight-medium">
        {{ truncate(repository.name, { length: lgAndUp ? 60 : 40 }) }}
      </VCardTitle>
      <div class="d-flex justify-start px-4">
        <UserAvatar :img-url="lastActivity.user.imgUrl" :size="38" />
        <div class="ml-3 overflow-hidden ">
          <div class="text-body-small">Edited {{ lastActivityTimeago }} by</div>
          <div class="text-body-medium text-truncate">
            {{ lastActivity.user.label }}
          </div>
        </div>
      </div>
    </div>
    <VSpacer />
    <VCardActions class="pb-2 px-2 align-center">
      <VBtn
        v-tooltip:bottom="{
          text: `${isPinned ? 'Unpin' : 'Pin'} ${schemaName}`,
          openDelay: 400,
        }"
        :class="['glass-btn', { 'glass-btn--active': isPinned }]"
        :icon="isPinned ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
        variant="text"
        aria-label="Pin repository"
        size="small"
        @click.stop="store.pin({ id: repository.id, pin: !isPinned })"
      />
      <Tags :repository="repository" class="glass-tags" />
    </VCardActions>
  </VCard>
</template>

<script lang="ts" setup>
import { first, get, truncate } from 'lodash-es';
import type {
  Repository,
  RepositoryFileMeta,
} from '@tailor-cms/interfaces/repository';
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

// Signed URLs are delivered on the list payload (RepositoryFileMeta);
// prefer the cached thumbnail and fall back to the original file.
const thumbnailUrl = computed(() => {
  const poster = props.repository.data.posterImage as RepositoryFileMeta | undefined;
  return poster?.thumbnailUrl ?? poster?.publicUrl ?? '';
});

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
@use '@tailor-cms/core-components/src/mixins';

.repository-card {
  position: relative;
  height: 12.75rem;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
  }

  // Keep foreground content above the poster artwork.
  .card-body,
  :deep(.v-card-actions) {
    position: relative;
    z-index: 1;
  }
}

.card-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

// Full-width, heavily blurred copy of the poster. Fills the area left of the
// sharp cover with matching colors so the scrim fades image-into-image
// instead of image-into-empty-surface. Scaled up so the blur doesn't leave
// translucent edges.
.card-underlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-cover {
  position: absolute;
  inset: 0;
  left: 25%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// Fade the artwork into the card surface from the left. Theme-aware, so it
// reads dark in dark mode and light in light mode. The stops follow an
// ease curve — a plain linear fade leaves visible banding at each stop.
.card-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgb(var(--v-theme-surface-raised)) 0%,
    rgba(var(--v-theme-surface-raised), 0.97) 18%,
    rgba(var(--v-theme-surface-raised), 0.89) 30.6%,
    rgba(var(--v-theme-surface-raised), 0.76) 42.3%,
    rgba(var(--v-theme-surface-raised), 0.58) 54%,
    rgba(var(--v-theme-surface-raised), 0.38) 64.8%,
    rgba(var(--v-theme-surface-raised), 0.2) 74.7%,
    rgba(var(--v-theme-surface-raised), 0.07) 82.8%,
    transparent 90%
  );
}

// Progressive blur: three masked backdrop layers ramping 3 -> 9 -> 20px,
// each revealed further left so the blur intensifies toward the left edge.
.card-blur {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.card-blur--1 { @include mixins.blur-band(3px, 42%, 68%); }
.card-blur--2 { @include mixins.blur-band(9px, 28%, 52%); }
.card-blur--3 { @include mixins.blur-band(20px, 12%, 34%); }

.glass {
  @include mixins.glass;
}

.glass-pill {
  border-radius: 999px;
}

// Pin button
.glass-btn {
  @include mixins.glass;

  &--active {
    color: rgb(var(--v-theme-tertiary));
    background: rgba(var(--v-theme-tertiary), 0.15);
    border-color: rgba(var(--v-theme-tertiary), 0.3);
  }
}

// Tag chips + add-tag button rendered by the Tags child component
.glass-tags :deep(.v-chip),
.glass-tags :deep(.v-btn) {
  @include mixins.glass;
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

// Left slot cross-fades the published-status dot into the select checkbox on
// hover/selection (same footprint, no layout shift) — mirrors the asset list.
.select-checkbox {
  position: relative;
  flex: none;
  margin-left: -0.25rem;
  width: 1.75rem;
  height: 1.75rem;
  margin-right: 0.25rem;
  cursor: pointer;
  border-radius: 4px;

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }

  .status-dot,
  .checkbox {
    position: absolute;
    inset: 0;
    margin: auto;
    transition:
      opacity 0.28s ease-in-out,
      transform 0.28s ease-in-out;
  }

  .checkbox {
    opacity: 0;
    transform: scale(0.7);
    pointer-events: none;
  }
}

.repository-card:hover .select-checkbox,
.select-checkbox:focus-visible,
.select-checkbox.is-selected {
  .checkbox {
    opacity: 1;
    transform: scale(1);
  }

  .status-dot {
    opacity: 0;
    transform: scale(0.7);
  }
}
</style>
