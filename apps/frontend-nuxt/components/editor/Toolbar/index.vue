<template>
  <div class="toolbar-wrapper">
    <div
      v-if="activity"
      :class="[showPublishDiff ? 'primary-darken-4' : 'primary-darken-3']"
      class="activity-toolbar"
    >
      <!-- <ActivityActions class="d-flex flex-grow-0" /> -->
      <h1 class="pt-2 text-h5 text-truncate">
        <span>{{ config.label }}</span>
        <span class="px-2 text-grey">|</span>
        <span class="text-secondary-lighten-3">
          {{ activity.data.name }}
        </span>
        <template v-if="showPublishDiff">
          <span class="px-2 text-grey">|</span>
          <span class="text-white">comparing with published</span>
          <span class="px-2 text-grey">@</span>
          <VChip
            color="primary-lighten-4"
            textColor="grey-darken-4"
            small
            label
            class="readonly"
          >
            {{ activity.publishedAt }}
          </VChip>
        </template>
      </h1>
      <!-- <ActiveUsers v-if="!showPublishDiff" :users="activeUsers" class="mx-6" /> -->
    </div>
    <ElementToolbarContainer v-if="element" :element="element" />
  </div>
</template>

<script lang="ts" setup>
// import ActivityActions from './ActivityActions.vue';
// import ActiveUsers from '@tailor-cms/core-components';
import ElementToolbarContainer from './ElementToolbarContainer.vue';
import { useEditorStore } from '@/stores/editor';

defineProps({
  element: { type: Object, default: null },
  activeUsers: { type: Array, default: () => [] },
});

const { $schemaService } = useNuxtApp() as any;

// TODO: computed(() => this.$store.state.editor.showPublishDiff);
const showPublishDiff = false;

const editorStore = useEditorStore();
const activity = computed(() => editorStore.selectedActivity);
const config = computed(
  () => activity.value && $schemaService.getLevel(activity.value?.type),
);
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  width: 100%;

  ::v-deep .v-text-field__details {
    margin: 0 !important;
    padding: 0 !important;

    .primary--text {
      opacity: 0;
    }

    .error--text {
      position: absolute;
      margin-top: 0.125rem;
      padding: 0.5rem;
      color: #fff !important;
      background-color: #3a3a3a;
      border-radius: 4px;
    }
  }
}

.activity-toolbar {
  display: flex;
  height: 3.5rem;
  padding: 0.25rem 0 0;
  z-index: 999;

  h1 {
    flex: 1;
    margin: 0;
    color: #fff;
    font-size: 1.375rem;
    text-align: left;
  }
}
</style>
