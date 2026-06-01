<template>
  <div
    v-if="isPanelEnabled"
    ref="rootEl"
    class="agent-panel"
  >
    <VCard
      v-if="isPanelOpen"
      class="panel-card"
      elevation="5"
      max-height="68vh"
      width="580"
      rounded="xl"
    >
      <PanelHeader
        :is-running="isRunning"
        :focus-label="focusLabel"
        @session:reset="runner.resetSession"
        @panel:close="closePanel"
      />
      <AgentMessageList
        ref="messageListEl"
        :messages="messages"
        :is-running="isRunning"
        :status-text="activeStatus"
        :error="runnerError"
      />
      <div v-if="pendingQuestion" class="question-host ma-4">
        <AgentQuestion
          v-bind="pendingQuestion"
          @pick="runner.send"
          @cancel="pendingQuestion = null"
        />
      </div>
      <AgentInput
        ref="inputEl"
        v-model="prompt"
        v-model:mode="mode"
        v-model:effort="effort"
        :disabled="isRunning"
        @autorun="runner.send"
        @focus="scrollToLatest"
        @submit="sendPrompt"
      />
      <AgentSessionStats
        v-if="lastTurns != null"
        :session-id="sessionId"
        :turns="lastTurns"
        :tool-count="lastToolCount || 0"
      />
    </VCard>
    <PanelLauncher v-else :is-running="isRunning" @open="openPanel" />
  </div>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';
import { AGENT_MODES, AgentMode } from '@tailor-cms/interfaces/agent.ts';
import {
  REASONING_EFFORTS,
  ReasoningEffort,
  type ReasoningEffortLiteral,
} from '@tailor-cms/interfaces/ai.ts';
import AgentInput from './AgentInput/index.vue';
import AgentMessageList from './AgentMessageList.vue';
import AgentQuestion from './AgentQuestion/index.vue';
import AgentSessionStats from './AgentSessionStats.vue';
import PanelHeader from './PanelHeader.vue';
import PanelLauncher from './PanelLauncher.vue';
import { useAgentFocus } from './composables/useAgentFocus';
import { useAgentRunner } from './composables/useAgentRunner';
import { useAgentSession } from './composables/useAgentSession';
import { useAgentStatusRotation } from './composables/useAgentStatusRotation';
import { usePanelVisibility } from './composables/usePanelVisibility';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';

const route = useRoute();
const authStore = useAuthStore();
const config = useConfigStore();
const repositoryStore = useCurrentRepository();

const rootEl = ref<HTMLElement | null>(null);
const inputEl = ref<{ focus: () => void } | null>(null);
const messageListEl = ref<{ scrollToBottom: () => void } | null>(null);
const prompt = ref('');

const repositoryId = computed(() => repositoryStore.repositoryId);

// Storage keys use the repo uid;
// numeric ids collide across local db resets, which would resurface a
// previous database's transcript under a brand-new repo with the same id.
const repositoryUid = computed(
  () => (repositoryStore.repository as any)?.uid || null,
);

const isPanelEnabled = computed(() =>
  Boolean(
    authStore.isAdmin
    && config.props.aiUiEnabled
    && route.params.id,
  ),
);

const { focusLabel, focusPayload } = useAgentFocus();

const { sessionId, messages } = useAgentSession(repositoryUid);

const mode = useLocalStorage<AgentMode>('agent-panel:mode', AgentMode.Edit);
if (!(AGENT_MODES as readonly string[]).includes(mode.value)) {
  mode.value = AgentMode.Edit;
}

const effort = useLocalStorage<ReasoningEffortLiteral>(
  'agent-panel:effort',
  ReasoningEffort.Medium,
);

if (!(REASONING_EFFORTS as readonly string[]).includes(effort.value)) {
  effort.value = ReasoningEffort.Medium;
}

const {
  isOpen: isPanelOpen,
  open: openPanel,
  close: closePanel,
} = usePanelVisibility({ rootEl, inputEl, isEnabled: isPanelEnabled });

const {
  activeStatus,
  start: startStatus,
  stop: stopStatus,
} = useAgentStatusRotation();

// Wrapped in nextTick because the trigger usually coincides with a DOM
// mutation (new message, focus flip on panel open); layout needs to
// settle before we measure scrollHeight.
function scrollToLatest() {
  nextTick(() => messageListEl.value?.scrollToBottom());
}

const runner = useAgentRunner({
  repositoryId,
  sessionId,
  messages,
  mode,
  effort,
  focusPayload,
  onScroll: scrollToLatest,
  onRunStart: startStatus,
  onRunEnd: stopStatus,
});

const {
  isRunning,
  error: runnerError,
  lastTurns,
  lastToolCount,
  pendingQuestion,
} = runner;

// Repo switch wipes transient UI state.
watch(repositoryId, () => {
  prompt.value = '';
  runner.clearRunState();
  stopStatus();
});

async function sendPrompt() {
  const message = prompt.value;
  prompt.value = '';
  const result = await runner.send(message);
  // Restore the text if the send was rejected (no repo or already running)
  // so the user doesn't lose what they typed.
  if (result.cancelled) prompt.value = message;
}

onMounted(scrollToLatest);
</script>

<style lang="scss" scoped>
.agent-panel {
  position: fixed;
  right: 1.75rem;
  bottom: 0.75rem;
  z-index: 9000;
}

.panel-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

<style lang="scss">
// Vuetify teleports VMenu/VSelect overlays outside the panel DOM - lift
// them above the panel card (z 9000) so dropdowns aren't clipped behind it.
.agent-panel-menu {
  z-index: 99999 !important;
}
</style>
