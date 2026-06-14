<template>
  <VNavigationDrawer
    v-if="configStore.isAiAvailable || isLensVisible"
    border="none"
    class="right-rail"
    elevation="0"
    location="right"
    width="76"
    permanent
  >
    <template #append>
      <div class="d-flex flex-column align-center pb-3">
        <VBtn
          v-if="isLensVisible"
          :active="reviewStore.isPanelOpen"
          :ripple="false"
          class="rail-tab my-2"
          height="60"
          prepend-icon="mdi-camera-iris"
          text="Lens"
          variant="text"
          stacked
          @click="reviewStore.isPanelOpen = !reviewStore.isPanelOpen"
        />
        <!-- Renoir floating-launcher, perched at the rail's bottom. -->
        <PanelLauncher
          v-if="configStore.isAiAvailable"
          :is-running="isAgentRunning"
          class="rail-renoir"
          @open="openAgentPanel"
        />
      </div>
    </template>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config';
import { useReviewStore } from '@/stores/review';
import PanelLauncher from '@/components/common/AgentPanel/PanelLauncher.vue';

const route = useRoute();
const configStore = useConfigStore();
const reviewStore = useReviewStore();

const { $eventBus } = useNuxtApp() as any;
const agentChannel = $eventBus.channel('agent');

// The Lens (review) sidebar exists only in the editor context.
const isLensVisible = computed(
  () => route.name === 'editor' && reviewStore.isLensAvailable,
);

// Mirrors the agent panel's run state (broadcast on the agent bus)
const isAgentRunning = ref(false);

const onRunState = ({ isRunning }: { isRunning: boolean }) => {
  isAgentRunning.value = isRunning;
};

const openAgentPanel = () => {
  agentChannel.emit('panel:open');
};

onMounted(() => {
  agentChannel.on('run:state', onRunState);
});

onBeforeUnmount(() => {
  agentChannel.off('run:state', onRunState);
});
</script>

<style lang="scss" scoped>
.right-rail {
  text-align: center;
}

.rail-tab {
  min-width: unset;
  justify-content: center;
  padding: 0;
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  text-transform: none;
  border-radius: 10px;
  transition: color 0.3s ease;

  :deep(.v-btn__overlay) {
    opacity: 0 !important;
  }

  :deep(.v-btn__prepend) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.125rem;
    margin-inline: 0;
    border-radius: 8px;
    transition: background-color 0.3s ease, color 0.3s ease;

    .v-icon {
      transition: transform 0.3s ease;
    }
  }

  &:hover :deep(.v-btn__prepend) {
    background: rgba(var(--v-theme-on-surface-container-highest), 0.2);
    color: rgba(var(--v-theme-on-surface), 1);

    .v-icon {
      transform: scale(1.1);
    }
  }

  &.v-btn--active {
    color: rgba(var(--v-theme-on-surface), 1);

    :deep(.v-btn__prepend) {
      background: rgba(var(--v-theme-surface-container-highest), 1);
      color: rgba(var(--v-theme-on-surface), 1);

      .v-icon {
        transform: scale(1.1);
      }
    }
  }
}

.right-rail :deep(.v-navigation-drawer__content) {
  overflow: visible;
}

.rail-renoir {
  margin: 0.5rem 0.125rem 0.5rem 0;
}
</style>
