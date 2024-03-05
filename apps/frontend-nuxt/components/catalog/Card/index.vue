<template>
  <VHover v-slot="{ isHovering: isCardHovered }">
    <VCard
      :elevation="isCardHovered ? 24 : 1"
      :ripple="false"
      class="repository-card d-flex flex-column justify-space-between text-left"
      color="primary-darken-4"
      data-testid="catalog__repositoryCard"
      @click="navigateTo({ name: 'repository', params: { id: repository.id } })"
    >
      <div class="card-body">
        <div class="d-flex align-center mt-1 ml-3 mr-1 mb-1">
          <VChip
            :color="repository.data.color"
            class="readonly px-1"
            size="x-small"
          />
          <VTooltip
            :disabled="!isSchemaTruncated"
            location="top"
            open-delay="300"
          >
            <template #activator="{ props: tooltipProps }">
              <span
                v-bind="tooltipProps"
                ref="schema"
                class="schema-name flex-grow-1 mx-2 text-truncate text-uppercase"
              >
                {{ schemaName }}
              </span>
            </template>
            {{ schemaName }}
          </VTooltip>
          <VTooltip location="top" open-delay="100">
            <template #activator="{ props: tooltipProps }">
              <VBadge
                v-bind="tooltipProps"
                :color="repository.hasUnpublishedChanges ? 'orange' : 'green'"
                class="pa-1"
                dot
                inline
              />
            </template>
            {{ publishingInfo }}
          </VTooltip>
          <VTooltip
            v-if="repository?.hasAdminAccess"
            location="top"
            open-delay="400"
          >
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                aria-label="Repository settings"
                class="repo-info mr-2"
                color="primary-darken-1"
                icon="mdi-cog"
                size="small"
                variant="text"
                @click.stop="navigateTo(`/repository/${repository.id}/root/settings`)"
              >
              </VBtn>
            </template>
            Open settings
          </VTooltip>
        </div>
        <VCardTitle class="pt-0 primary--text text--lighten-4 text-break">
          {{ truncate(repository.name, { length: lgAndUp ? 60 : 40 }) }}
        </VCardTitle>
        <div class="d-flex justify-start px-4 primary--text text--lighten-4">
          <VAvatar size="38">
            <img :src="lastActivity.user.imgUrl" alt="User avatar" width="38" />
          </VAvatar>
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
        <VTooltip location="bottom" open-delay="400">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              :color="isPinned ? 'lime accent-4' : 'primary lighten-3'"
              :icon="isPinned ? 'mdi-pin mdi-rotate-45' : 'mdi-pin'"
              class="mr-1"
              @click.stop="store.pin({ id: repository.id, pin: !isPinned })"
            >
            </VBtn>
          </template>
          {{ isPinned ? 'Unpin' : 'Pin' }} {{ schemaName }}
        </VTooltip>
        <Tags :repository="repository" />
      </VCardActions>
    </VCard>
  </VHover>
</template>

<script lang="ts" setup>
import first from 'lodash/first';
import get from 'lodash/get';
import truncate from 'lodash/truncate';
import { useDisplay } from 'vuetify';
import { useTimeAgo } from '@vueuse/core';

import type { Repository, Revision } from '@/api/interfaces/repository';
import Tags from './Tags/index.vue';
import { useRepositoryStore } from '@/stores/repository';

const props = defineProps<{ repository: Repository }>();

const store = useRepositoryStore();
const { $schemaService } = useNuxtApp() as any;
const { width: innerWidth, lgAndUp } = useDisplay();

const schema = ref(null);
const schemaName = computed(
  () => $schemaService.getSchema(props.repository.schema).name,
);
const isSchemaTruncated = ref(false);

const lastActivity = computed(() =>
  first(props.repository.revisions),
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
  isSchemaTruncated.value = clientWidth < scrollWidth;
};
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
    color: #fafafa;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 1px;
  }

  .v-card__title {
    line-height: 1.75rem;
  }

  .v-avatar {
    margin-top: 0.125rem;
  }
}

.repo-info.v-btn:not(.v-btn--text):not(.v-btn--outlined):hover::before {
  opacity: 0.2;
}
</style>
