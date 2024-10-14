<template>
  <VHover v-slot="{ isHovering: isCardHovered, props: hoverProps }">
    <VCard
      v-bind="hoverProps"
      :data-testid="`repositoryCard_${repository.id}`"
      :elevation="isCardHovered ? 4 : 1"
      :ripple="false"
      class="repository-card d-flex flex-column justify-space-between text-left"
      color="primary-darken-4"
      @click="navigateTo({ name: 'repository', params: { id: repository.id } })"
    >
      <div class="card-body">
        <div class="d-flex align-center mt-1 mr-1 mb-1 ml-3">
          <VChip :color="repository.data.color" class="px-1" size="x-small" />
          <VTooltip
            :disabled="!isSchemaNameTruncated"
            content-class="bg-primary-darken-4"
            location="top"
            offset="26"
            open-delay="300"
          >
            <template #activator="{ props: tooltipProps }">
              <div
                v-bind="tooltipProps"
                ref="schema"
                class="schema-name flex-grow-1 mx-2 text-truncate text-uppercase"
              >
                {{ schemaName }}
              </div>
            </template>
            {{ schemaName }}
          </VTooltip>
          <VTooltip
            content-class="bg-primary-darken-4"
            location="top"
            offset="28"
            open-delay="100"
          >
            <template #activator="{ props: tooltipProps }">
              <VBadge
                v-bind="tooltipProps"
                :aria-label="
                  repository.hasUnpublishedChanges
                    ? 'Has unpublished changes'
                    : 'Published'
                "
                :color="
                  repository.hasUnpublishedChanges ? 'orange-lighten-3' : 'teal'
                "
                class="mr-2"
                dot
                inline
              />
            </template>
            {{ publishingInfo }}
          </VTooltip>
          <VTooltip
            v-if="repository?.hasAdminAccess"
            content-class="bg-primary-darken-4"
            location="top"
            offset="20"
            open-delay="400"
          >
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                aria-label="Repository settings"
                class="repo-info mr-2"
                color="primary-lighten-2"
                icon="mdi-cog"
                size="small"
                variant="text"
                @click.stop="
                  navigateTo({
                    name: 'repository-settings-general',
                    params: { id: repository.id },
                  })
                "
              />
            </template>
            Open settings
          </VTooltip>
        </div>
        <VCardTitle class="pt-0 text-primary-lighten-5 text-break">
          {{ truncate(repository.name, { length: lgAndUp ? 60 : 40 }) }}
        </VCardTitle>
        <div class="d-flex justify-start px-4 text-primary-lighten-4">
          <UserAvatar :img-url="lastActivity.user.imgUrl" :size="38" />
          <div class="ml-3 overflow-hidden">
            <div class="text-caption">
              Edited
              {{ lastActivityTimeago }}
              by
            </div>
            <div class="text-body-2 text-truncate">
              {{ lastActivity.user.label }}
            </div>
          </div>
        </div>
      </div>
      <VSpacer />
      <VCardActions class="pb-2 px-2">
        <VTooltip
          content-class="bg-primary-darken-4"
          location="bottom"
          offset="20"
          open-delay="400"
        >
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              :color="isPinned ? 'lime-lighten-2' : 'primary-lighten-2'"
              :icon="isPinned ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
              aria-label="Pin repository"
              class="mr-1"
              @click.stop="store.pin({ id: repository.id, pin: !isPinned })"
            />
          </template>
          {{ isPinned ? 'Unpin' : 'Pin' }} {{ schemaName }}
        </VTooltip>
        <Tags :repository="repository" />
      </VCardActions>
    </VCard>
  </VHover>
</template>

<script lang="ts" setup>
import type { Repository, Revision } from '@tailor-cms/interfaces/repository';
import first from 'lodash/first';
import get from 'lodash/get';
import truncate from 'lodash/truncate';
import { useDisplay } from 'vuetify';
import { UserAvatar } from '@tailor-cms/core-components-next';
import { useTimeAgo } from '@vueuse/core';

import Tags from './Tags/index.vue';
import { useRepositoryStore } from '@/stores/repository';

const { $schemaService } = useNuxtApp() as any;
const store = useRepositoryStore();

const props = defineProps<{ repository: Repository }>();

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

const publishingInfo = computed(() =>
  props.repository.hasUnpublishedChanges
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
  transition: all 0.3s ease;
  cursor: pointer;

  @media (max-width: 1263px) {
    height: 17.25rem;
  }
}

.card-body {
  padding: 0.375rem 0 0;

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
</style>
