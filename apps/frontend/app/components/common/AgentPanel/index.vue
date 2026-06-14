<template>
  <div
    v-if="isPanelEnabled"
    ref="rootEl"
    class="agent-panel"
  >
    <DefinePanelBody>
      <PanelHeader
        :is-running="isRunning"
        :is-expanded="isExpanded"
        @session:reset="runner.resetSession"
        @panel:toggle-expand="isExpanded = !isExpanded"
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
        :focus-chip="focusChip"
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
    </DefinePanelBody>
    <VDialog
      v-model="isFullscreen"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <VCard class="panel-card-full">
        <div class="panel-body-column">
          <ReusePanelBody />
        </div>
      </VCard>
    </VDialog>
    <Transition name="panel-pop">
      <VCard
        v-if="isPanelOpen && !isExpanded"
        class="panel-card"
        elevation="5"
        max-height="68vh"
        width="580"
        rounded="xl"
      >
        <ReusePanelBody />
      </VCard>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { createReusableTemplate, useLocalStorage } from '@vueuse/core';
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
import { useAgentFocus } from './composables/useAgentFocus';
import { useAgentRunner } from './composables/useAgentRunner';
import { useAgentSession } from './composables/useAgentSession';
import { useAgentStatusRotation } from './composables/useAgentStatusRotation';
import { usePanelVisibility } from './composables/usePanelVisibility';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';

const config = useConfigStore();
const repositoryStore = useCurrentRepository();

const [DefinePanelBody, ReusePanelBody] = createReusableTemplate();

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

// The agent works on repository content, so the dock exists only
// within an initialized repository context.
const isPanelEnabled = computed(() =>
  Boolean(config.isAiAvailable && repositoryId.value),
);

const { focusChip, focusPayload } = useAgentFocus();
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

const isExpanded = ref(false);

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

const isFullscreen = computed({
  get: () => isPanelOpen.value && isExpanded.value,
  set: (value) => {
    if (!value) closePanel();
  },
});

const {
  isRunning,
  error: runnerError,
  lastTurns,
  lastToolCount,
  pendingQuestion,
} = runner;

watch(isPanelOpen, (open) => {
  if (!open) isExpanded.value = false;
});

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

// Other features (e.g. the feedback sidebar's "Fix with AI") hand off
// prefilled prompts through the agent bus channel; the user reviews and
// sends, the panel never auto-runs handed-off prompts.
const { $eventBus } = useNuxtApp() as any;
const agentChannel = $eventBus.channel('agent');

const onPanelOpen = () => {
  if (isPanelEnabled.value) openPanel();
};

const onPromptSet = ({ prompt: text }: { prompt: string }) => {
  if (!isPanelEnabled.value || isRunning.value) return;
  openPanel();
  prompt.value = text;
};

// Broadcast the run state so external launchers
watch(
  isRunning,
  (value) => agentChannel.emit('run:state', { isRunning: value }),
  { immediate: true },
);

onMounted(() => {
  scrollToLatest();
  agentChannel.on('prompt:set', onPromptSet);
  agentChannel.on('panel:open', onPanelOpen);
});

onBeforeUnmount(() => {
  agentChannel.off('prompt:set', onPromptSet);
  agentChannel.off('panel:open', onPanelOpen);
});
</script>

<style lang="scss" scoped>
.agent-panel {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 9000;
}

.panel-card {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Fullscreen (expanded) dialog: card fills the viewport, content is capped
// to a centered column so chat lines stay readable on wide screens.
.panel-card-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow: hidden;
}

.panel-body-column {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  max-width: 60rem;
  min-height: 0; // let the inner scroll area shrink instead of overflowing
}

.panel-pop-enter-active,
.panel-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom right;
}

.panel-pop-enter-from,
.panel-pop-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(12px);
}
</style>

<style lang="scss">
// Vuetify teleports VMenu/VSelect overlays outside the panel DOM - lift
// them above the panel card (z 9000) so dropdowns aren't clipped behind it.
.agent-panel-menu {
  z-index: 99999 !important;
}
</style>
