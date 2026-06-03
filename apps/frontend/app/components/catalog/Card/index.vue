<template>
  <VCard
    :data-testid="`repositoryCard_${repository.id}`"
    :ripple="false"
    class="repository-card d-flex flex-column text-left"
    rounded="xl"
    elevation="0"
    @click="navigateTo({ name: 'repository', params: { id: repository.id } })"
  >
    <div class="card-body">
      <div class="card-header d-flex align-center my-1 mx-3">
        <VCheckbox
          :model-value="isSelected"
          aria-label="Select repository"
          class="ml-n1"
          hide-details
          @click.stop
          @update:model-value="$emit('toggle-selection', repository.id)"
        />
        <div
          ref="schema"
          v-tooltip="{
            disabled: !isSchemaNameTruncated,
            text: schemaName,
            openDelay: 300,
          }"
          class="schema-name flex-grow-1 mx-2 text-truncate text-uppercase"
        >
          {{ schemaName }}
        </div>
        <VBadge
          v-tooltip:top="{ text: publishingInfo, openDelay: 100 }"
          :aria-label="hasUnpublishedChanges ? 'Has unpublished changes' : 'Published'"
          :color="hasUnpublishedChanges ? 'warning' : 'secondary'"
          class="mr-2"
          dot
          inline
        />
        <VBtn
          v-if="repository?.hasAdminAccess"
          v-tooltip:top="{ text: 'Open settings', openDelay: 400 }"
          aria-label="Repository settings"
          class="repo-info text-medium-emphasis"
          icon="mdi-cog"
          size="small"
          variant="text"
          @click.stop="navigateTo({
            name: 'repository-settings-general',
            params: { id: repository.id },
          })"
        />
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
        :color="isPinned ? 'highlight' : ''"
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
defineEmits(['toggle-selection']);

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
  height: 14.75rem;
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
  padding: 0.375rem 0 0;

  .card-header {
    min-height: 2.5rem;
  }

  .schema-name {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 1px;
  }

  .v-avatar {
    margin-top: 0.125rem;
  }
}

.v-card:hover > :deep(.v-card__overlay) {
  opacity: 0.01;
}

.v-checkbox :deep(.v-selection-control) {
  min-height: unset;
}
</style>
