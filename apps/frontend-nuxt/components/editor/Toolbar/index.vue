<template>
  <div class="toolbar-wrapper elevation-3">
    <div>
      <div
        v-if="activity && !element"
        :class="[
          showPublishDiff ? 'bg-primary-darken-2' : 'bg-primary-darken-4',
        ]"
        class="activity-toolbar px-3 align-center w-100"
      >
        <ActivityActions class="ml-1" />
        <h1 class="py-2 px-6 text-h5 text-truncate">
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
              class="readonly"
              color="primary-lighten-4"
              text-color="grey-darken-4"
              label
              small
            >
              {{ activity.publishedAt }}
            </VChip>
          </template>
        </h1>
        <!-- <ActiveUsers v-if="!showPublishDiff" :users="activeUsers" class="mx-6" /> -->
      </div>
      <ElementToolbarContainer
        v-if="element"
        :element="element"
        class="element-container"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
// TODO: Needs to be implemented
// import ActiveUsers from '@tailor-cms/core-components';
import ActivityActions from './ActivityActions.vue';
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
  position: relative;
  width: 100%;

  > div {
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    left: 27.5rem;
    margin-top: 5rem;
    min-height: 5.5rem;
    max-height: 9rem;
    z-index: 99;
  }

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
  height: 5.625rem;
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
