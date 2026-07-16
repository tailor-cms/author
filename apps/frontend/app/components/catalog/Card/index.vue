<template>
  <VCard
    :data-testid="`repositoryCard_${repository.id}`"
    :ripple="false"
    :class="{ 'selected': isSelected, 'has-artwork': !!thumbnailUrl }"
    class="repository-card d-flex flex-column text-left"
    rounded="xl"
    elevation="1"
    color="surface-raised"
    @click="navigateTo({ name: 'repository', params: { id: repository.id } })"
  >
    <!-- Poster artwork: sharp on the right, dissolving into the card surface on
         the left. A blurred base (mirrored reflection + a blurred cover copy)
         sits under a sharp cover masked to fade left, so it reads sharp on the
         right and softens leftward. Uses filter: blur() instead of
         backdrop-filter, whose stacked full-card layers thrashed the
         compositor and blanked cards on fast scroll (#752). -->
    <div v-if="thumbnailUrl" aria-hidden="true" class="card-bg">
      <img
        v-for="layer in posterLayers"
        :key="layer"
        :src="thumbnailUrl"
        :class="layer"
        alt=""
        loading="lazy"
      />
      <div class="card-scrim" />
    </div>
    <div class="card-body">
      <div class="card-header d-flex align-center ma-3 ml-4 mb-2">
        <div
          v-if="hasAdminAccess"
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
            :color="isSelected ? 'primary' : undefined"
            :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
            class="checkbox"
            size="24"
          />
        </div>
        <VIcon
          v-tooltip:top="{ text: publishingInfo, openDelay: 100 }"
          :aria-label="hasUnpublishedChanges ? 'Has unpublished changes' : 'Published'"
          :color="hasUnpublishedChanges ? 'warning' : 'success'"
          class="status-dot mr-2"
          icon="mdi-circle"
          size="14"
        />
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
          v-if="hasAdminAccess || repositoryActions.length"
          class="d-flex align-center ga-1"
        >
          <VBtn
            v-if="hasAdminAccess"
            v-tooltip:top="{ text: 'Open settings', openDelay: 400 }"
            aria-label="Repository settings"
            class="repo-info glass-btn"
            density="comfortable"
            icon="mdi-cog"
            size="small"
            variant="text"
            @click.stop="navigateTo({
              name: 'repository-settings-general',
              params: { id: repository.id },
            })"
          />
          <VMenu
            v-if="repositoryActions.length"
            location="bottom end"
            offset="4"
          >
            <template #activator="{ props: menuProps }">
              <VBtn
                v-tooltip:top="{ text: 'Repository actions', openDelay: 400 }"
                v-bind="menuProps"
                aria-label="Repository actions"
                class="repo-info glass-btn"
                density="comfortable"
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                @click.stop
              />
            </template>
            <VList density="compact" min-width="200" nav>
              <VListItem
                v-for="action in repositoryActions"
                :key="action.name"
                :base-color="action.color"
                :prepend-icon="`mdi-${action.icon}`"
                :title="action.label"
                rounded="lg"
                @click.stop="onRepositoryAction(action.name)"
              />
            </VList>
          </VMenu>
        </div>
      </div>
      <VCardTitle class="text-break font-weight-medium mb-2 py-0">
        {{ repository.name }}
      </VCardTitle>
      <div class="d-flex justify-start align-center px-4 py-2">
        <UserAvatar :img-url="lastActivity.user.imgUrl" :size="34" />
        <div class="ml-3 overflow-hidden ">
          <div class="text-label-small">Edited {{ lastActivityTimeago }} by</div>
          <div class="text-label-large text-truncate">
            {{ lastActivity.user.label }}
          </div>
        </div>
      </div>
    </div>
    <VSpacer />
    <VCardActions class="px-3 py-3 align-center">
      <VBtn
        v-tooltip:bottom="{
          text: `${isPinned ? 'Unpin' : 'Pin'} ${schemaName}`,
          openDelay: 400,
        }"
        variant="text"
        aria-label="Pin repository"
        size="x-small"
        :color="isPinned ? 'tertiary' : ''"
        icon
        @click.stop="store.pin({ id: repository.id, pin: !isPinned })"
      >
        <VIcon :icon="isPinned ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'" size="20" />
      </VBtn>
      <Tags :repository="repository" class="glass-tags" />
    </VCardActions>
  </VCard>
</template>

<script lang="ts" setup>
import type {
  Repository,
  RepositoryFileMeta,
} from '@tailor-cms/interfaces/repository';
import type { RepositoryAction } from '@/composables/useRepositoryActions';
import type { Revision } from '@tailor-cms/interfaces/revision';
import { first, get } from 'lodash-es';
import { useDisplay } from 'vuetify';
import { UserAvatar } from '@tailor-cms/core-components';
import { useTimeAgo } from '@vueuse/core';

import { useRepositoryStore } from '@/stores/repository';
import Tags from './Tags/index.vue';

// Poster layers, painted back-to-front: the blurred mirror base, a blurred
// cover base, then the sharp cover masked to fade left.
const posterLayers = [
  'card-underlay',
  'card-cover card-cover--blur',
  'card-cover card-cover--sharp',
];

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

// Template ref
const schema = ref(null);
const isSchemaNameTruncated = ref(false);
const schemaName = computed(() => $schemaService.getLabel(props.repository));

// Signed URLs are delivered on the list payload (RepositoryFileMeta);
// prefer the cached thumbnail and fall back to the original file.
const thumbnailUrl = computed(() => {
  const poster =
    props.repository.data.posterImage as RepositoryFileMeta | undefined;
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

const repositoryActions = useRepositoryActions(
  () => props.repository.accessPolicy,
);
const hasAdminAccess = computed(() => !!props.repository.hasAdminAccess);

const onRepositoryAction = (name: RepositoryAction['name']) =>
  emit(name, props.repository);

const detectSchemaTruncation = () => {
  const { clientWidth, scrollWidth } = schema.value as any;
  isSchemaNameTruncated.value = clientWidth < scrollWidth;
};

const { width: innerWidth } = useDisplay();
watch(() => innerWidth.value, detectSchemaTruncation);

onMounted(() => nextTick(detectSchemaTruncation));
</script>

<style lang="scss" scoped>
@use '@tailor-cms/core-components/src/mixins';

.repository-card {
  position: relative;
  height: 13rem;
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

// --- Poster artwork stack (behind the content) ---
.card-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

// Mirror reflection of the cover, hinged at the 25% seam. Its box matches the
// cover's dimensions (identical object-fit crop) but its right edge sits on the
// seam and it's flipped horizontally, so the image's left-edge column lands
// exactly where the cover's does — the two align at the seam and the reflection
// continues leftward, giving the scrim an image-into-image fade.
.card-underlay {
  position: absolute;
  top: 0;
  right: 75%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  // Mirrored + blurred: the soft left base.
  transform: scaleX(-1) scale(1.06);
  filter: blur(16px);
}

.card-cover {
  position: absolute;
  inset: 0;
  left: 25%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// Blurred cover copy: the right-hand half of the soft base
.card-cover--blur {
  transform: scale(1.06);
  filter: blur(16px);
}

// Sharp cover on top, masked to fade out toward the left so it dissolves into
// the blurred base
.card-cover--sharp {
  -webkit-mask-image: linear-gradient(to right, transparent 8%, black 45%);
  mask-image: linear-gradient(to right, transparent 8%, black 45%);
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

// Icon buttons layered over the poster (settings cog, actions menu)
.glass-btn {
  @include mixins.glass;
}

// Tag chips + add-tag button rendered by the Tags child component
.glass-tags :deep(.v-chip),
.glass-tags :deep(.v-btn) {
  @include mixins.glass;
}

.glass-tags :deep(.v-chip .v-chip__underlay) {
  border-radius: 0;
}

.card-body {
  // Width-aware truncation: clamp to two lines instead of a character cap.
  .v-card-title {
    max-width: 65%;
    line-height: 1;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    white-space: normal;
  }

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
}

// Select checkbox occupies zero width at rest and expands on
// hover/focus/selection, nudging the status dot and schema name right
// instead of covering them — the dot (and its tooltip) stays visible.
.select-checkbox {
  flex: none;
  width: 0;
  height: 1.75rem;
  overflow: hidden;
  opacity: 0;
  cursor: pointer;
  border-radius: 4px;
  transition:
    width 0.28s ease-in-out,
    margin 0.28s ease-in-out,
    opacity 0.28s ease-in-out;
}

.status-dot {
  flex: none;
}

.repository-card:hover .select-checkbox,
.select-checkbox:focus-visible,
.select-checkbox.is-selected {
  width: 1.75rem;
  margin-left: -0.25rem;
  margin-right: 0.25rem;
  opacity: 1;
}
</style>
