<template>
  <template v-if="isPanelEnabled">
    <VNavigationDrawer
      v-model="isPanelOpen"
      :class="{ resizing: isResizing }"
      :width="width"
      class="agent-drawer"
      border="none"
      color="transparent"
      elevation="0"
      location="right"
      disable-resize-watcher
      disable-route-watcher
    >
      <div class="agent-drawer-card bg-surface-container-lowest border-sm">
        <div
          aria-orientation="vertical"
          class="resize-handle"
          role="separator"
          @pointerdown="startResize"
        />
        <div class="agent-drawer-layout">
          <PanelHeader
            :is-running="isRunning"
            :has-messages="messages.length > 0"
            @session:reset="resetSession"
            @panel:close="closePanel"
          />
          <AgentMessageList
            ref="messageListEl"
            :messages="messages"
            :is-running="isRunning"
            :status-text="activeStatus"
            :error="runnerError"
          />
          <div v-if="pendingQuestion" class="question-host ma-5 mt-0">
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
        </div>
        <ResetSessionDialog
          v-model="isResetConfirmOpen"
          @confirm="runner.resetSession"
        />
      </div>
    </VNavigationDrawer>
  </template>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';
import { useDisplay } from 'vuetify';
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
import ResetSessionDialog from './ResetSessionDialog.vue';
import { useAgentFocus } from './composables/useAgentFocus';
import { useAgentRunner } from './composables/useAgentRunner';
import { useAgentSession } from './composables/useAgentSession';
import { useAgentStatusRotation } from './composables/useAgentStatusRotation';
import { usePanelVisibility } from './composables/usePanelVisibility';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';

const config = useConfigStore();
const repositoryStore = useCurrentRepository();
const { xlAndUp } = useDisplay();

const inputEl = ref<{ focus: () => void } | null>(null);

const { width, isResizing, startResize } = useDrawerResize({
  side: 'right',
  storageKey: 'agent-panel:width',
  defaultWidth: () => (xlAndUp.value ? 520 : 420),
});

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

const {
  isOpen: isPanelOpen,
  open: openPanel,
  close: closePanel,
  toggle: togglePanel,
} = usePanelVisibility({ inputEl, isEnabled: isPanelEnabled });

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

// Confirm before wiping the transcript (no undo). The header disables
// this on an empty panel, so there's always a conversation to lose here.
const isResetConfirmOpen = ref(false);

function resetSession() {
  isResetConfirmOpen.value = true;
}

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

const onPanelToggle = () => {
  if (isPanelEnabled.value) togglePanel();
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

// Broadcast open state so the app-bar launcher can show an active state.
watch(
  isPanelOpen,
  (value) => agentChannel.emit('open:state', { isOpen: value }),
  { immediate: true },
);

onMounted(() => {
  scrollToLatest();
  agentChannel.on('prompt:set', onPromptSet);
  agentChannel.on('panel:toggle', onPanelToggle);
});

onBeforeUnmount(() => {
  agentChannel.off('prompt:set', onPromptSet);
  agentChannel.off('panel:toggle', onPanelToggle);
});
</script>

<style lang="scss" scoped>
.agent-drawer {
  text-align: left;

  // Suppress the drawer's width animation while dragging the handle so the
  // edge tracks the pointer instead of easing behind it.
  &.resizing {
    transition-duration: 0s !important;
  }

  :deep(.v-navigation-drawer__content) {
    overflow: hidden;
  }
}

.agent-drawer-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0 0.75rem 0 0;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

.agent-drawer-layout {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
}

// Drag seam over the card's left border, matching the other resizable
// sidebars: a thin strip that fills with translucent primary on hover/drag.
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0.3125rem;
  z-index: 100;
  cursor: col-resize;
  touch-action: none;

  &:hover,
  &:active,
  .agent-drawer.resizing & {
    background: rgba(var(--v-theme-primary), 0.25);
  }
}
</style>

<style lang="scss">
// Vuetify teleports VMenu/VSelect overlays outside the panel DOM - lift
// them above the panel drawer so dropdowns aren't clipped behind it.
.agent-panel-menu {
  z-index: 99999 !important;
}
</style>
