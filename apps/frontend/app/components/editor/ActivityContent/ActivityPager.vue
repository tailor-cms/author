<template>
  <nav v-if="previous || next" aria-label="Activity pagination" class="mb-16">
    <VDivider class="mb-6" />
    <VRow>
      <VCol v-if="previous" cols="12" sm="6">
        <VCard
          :style="{ '--type-accent': getColor(previous.type) }"
          :to="getRoute(previous)"
          class="pager-card pager-card--previous bg-surface-raised"
          data-testid="editor-pager-previous"
          elevation="1"
          rounded="lg"
        >
          <div class="d-flex align-center ga-3 pa-4">
            <VIcon icon="mdi-chevron-left" size="small" />
            <div class="pager-card__label text-left">
              <div class="text-body-small text-medium-emphasis">
                Previous · {{ getLabel(previous.type) }}
              </div>
              <div class="text-title-small font-weight-bold text-truncate">
                {{ getActivityName(previous) }}
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
      <VCol v-if="next" :offset-sm="previous ? 0 : 6" cols="12" sm="6">
        <VCard
          :style="{ '--type-accent': getColor(next.type) }"
          :to="getRoute(next)"
          class="pager-card pager-card--next bg-surface-raised"
          data-testid="editor-pager-next"
          elevation="1"
          rounded="lg"
        >
          <div class="d-flex align-center justify-end ga-3 pa-4">
            <div class="pager-card__label text-right">
              <div class="text-body-small text-medium-emphasis">
                Next · {{ getLabel(next.type) }}
              </div>
              <div class="text-title-small font-weight-bold text-truncate">
                {{ getActivityName(next) }}
              </div>
            </div>
            <VIcon icon="mdi-chevron-right" size="small" />
          </div>
        </VCard>
      </VCol>
    </VRow>
  </nav>
</template>

<script lang="ts" setup>
const { $schemaService } = useNuxtApp() as any;

const { getActivityName } = useActivityName();
const { previous, next, getRoute } = useEditorPagination();

const getLabel = (type: string) => $schemaService.getLevel(type)?.label;
const getColor = (type: string) => $schemaService.getLevel(type)?.color;
</script>

<style lang="scss" scoped>
.pager-card {
  &--previous {
    border-left: 0.5rem solid var(--type-accent);
  }

  &--next {
    border-right: 0.5rem solid var(--type-accent);
  }

  &__label {
    min-width: 0;
  }
}
</style>
