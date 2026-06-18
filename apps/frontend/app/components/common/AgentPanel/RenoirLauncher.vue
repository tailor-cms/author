<template>
  <template v-if="showRenoir">
    <VBtn
      :class="{ 'is-running': isAgentRunning }"
      :color="isPanelOpen ? 'tertiary' : undefined"
      class="renoir-pill"
      height="40"
      rounded="pill"
      variant="tonal"
      @click="openAgentPanel"
    >
      <span class="renoir-pill-avatar">
        <LauncherParticles v-if="isAgentRunning" :size="32" />
        <img
          :src="renoirImage"
          alt=""
          class="renoir-pill-head"
          draggable="false"
        />
      </span>
      <span class="renoir-pill-label">Renoir</span>
      <VHotkey
        class="renoir-pill-kbd"
        keys="cmd+k"
        density="compact"
        variant="contained"
      />
    </VBtn>
    <VDivider class="renoir-divider my-5 mx-3" opacity="0.2" vertical />
  </template>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';
import LauncherParticles from '@/components/common/AgentPanel/LauncherParticles.vue';

const config = useConfigStore();
const currentRepositoryStore = useCurrentRepository();

const { $eventBus } = useNuxtApp() as any;
const agentChannel = $eventBus.channel('agent');

// Renoir (agent launcher) lives in the app bar, but only within the
// repository workspace where the assistant has content to act on.
const showRenoir = computed(
  () => config.isAiAvailable && Boolean(currentRepositoryStore.repository),
);

// Mirrors the agent panel's run/open state (broadcast on the agent bus).
const isAgentRunning = ref(false);
const isPanelOpen = ref(false);
const onRunState = ({ isRunning }: { isRunning: boolean }) => {
  isAgentRunning.value = isRunning;
};
const onOpenState = ({ isOpen }: { isOpen: boolean }) => {
  isPanelOpen.value = isOpen;
};

// Renoir's head bobs while idle, swaps to the thinking animation while running.
const renoirImage = computed(() =>
  isAgentRunning.value ? '/img/renoir/thinking.gif' : '/img/renoir/head.png',
);

const openAgentPanel = () => agentChannel.emit('panel:toggle');

onMounted(() => {
  agentChannel.on('run:state', onRunState);
  agentChannel.on('open:state', onOpenState);
});
onBeforeUnmount(() => {
  agentChannel.off('run:state', onRunState);
  agentChannel.off('open:state', onOpenState);
});
</script>

<style lang="scss" scoped>
.renoir-pill {
  padding-inline: 0.375rem 0.625rem;
  overflow: visible;

  :deep(.v-btn__content) {
    overflow: visible;
  }

  &.is-running .renoir-pill-head {
    // Grow and drop a little while thinking, mirroring the original
    // floating launcher (head spills below the pill).
    transform: translateY(0.25rem) scale(1.5);
  }
}

// Positioned host so the thinking particles can orbit the head.
.renoir-pill-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
}

.renoir-pill-head {
  width: 1.625rem;
  height: 1.625rem;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.renoir-pill-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.renoir-pill-kbd {
  margin-left: 0.5rem;

  :deep(.v-kbd) {
    padding: 0.125rem 0.25rem;
    border-radius: 8px;
  }
}
</style>
