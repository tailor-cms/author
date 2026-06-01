<template>
  <div class="cmd-anchor">
    <VBtn
      prepend-icon="mdi-slash-forward"
      size="small"
      text="Commands"
      variant="text"
      rounded="lg"
      @click="toggleMenu"
    />
    <VMenu
      :close-on-content-click="false"
      :model-value="isOpen"
      :open-on-click="false"
      :z-index="9999"
      activator="parent"
      location="top start"
      @update:model-value="(open) => !open && (isOpen = false)"
    >
      <VCard class="agent-cmd-menu" elevation="3">
        <div class="cmd-header py-1 px-3 border-b">
          <VIcon
            class="text-medium-emphasis"
            icon="mdi-slash-forward-box"
            size="16"
          />
          <span class="text-label-medium ml-2">
            {{ slashQuery ? `/${slashQuery}` : 'Commands' }}
          </span>
        </div>
        <VList class="cmd-list" nav>
          <VListItem
            v-for="(command, i) in visibleCommands"
            :key="command.id"
            :active="i === activeIndex"
            :prepend-icon="command.icon"
            :subtitle="command.hint"
            class="cmd-item py-2"
            @click="commit(command)"
          >
            <template #title>
              <VListItemTitle class="cmd-title">
                <code class="cmd-id mr-1">/{{ command.id }}</code>
                {{ command.label }}
              </VListItemTitle>
            </template>
          </VListItem>
          <VListItem
            v-if="!visibleCommands.length"
            title=" No matching commands"
            disabled
          />
        </VList>
        <div class="cmd-footer border-t">
          <span>
            <VHotkey keys="up" density="compact" variant="tonal" />
            <VHotkey
              keys="down"
              suffix="navigate"
              density="compact"
              variant="tonal"
            />
          </span>
          <VHotkey
            keys="enter"
            suffix="select"
            density="compact"
            variant="tonal"
          />
          <VHotkey
            keys="escape"
            suffix="close"
            density="compact"
            variant="tonal"
          />
        </div>
      </VCard>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import { oneLine } from 'common-tags';
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';

interface Props {
  mode: AgentMode;
}

interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: string;
  // Minimum panel mode required to run.
  requires: AgentMode;
  prompt: string;
}

/**
 * Slash-command catalog surfaced in the agent input. Each command
 * dispatches its prompt to the agent immediately; the user-visible
 * label is what shows in the chat bubble. `scope` mirrors the backend
 * ToolScope semantics: `read` works in any mode; `write` requires
 * Edit mode and is disabled in Inspect.
 */
const COMMANDS: SlashCommand[] = [
  {
    id: 'content',
    label: 'Generate section content',
    hint: 'Fill the focused item',
    icon: 'mdi-text-box-edit-outline',
    requires: AgentMode.Edit,
    prompt: oneLine`
      Generate a content for selected item. Use first description tool
      to get more info about the item and its context.
    `,
  },
  {
    id: 'inspect',
    label: 'Inspect this',
    hint: 'Show what the focused outline item contains',
    icon: 'mdi-magnify',
    requires: AgentMode.Inspect,
    prompt: oneLine`
      Inspect the focused outline item using get_activity_subtree, then
      write a glanceable summary for an author; not a debug dump.
      Constraints: (1) Open with one sentence stating WHAT the focused
      thing is and how complete it feels overall (e.g. "mostly empty",
      "one page drafted, two stubs"). (2) List direct children as short
      bullets, then a 3-6 word status hint
      (e.g. "drafted", "empty section only", "no content yet"). Do NOT
      enumerate individual content elements, do NOT print element ids,
      do NOT list section ids. (3) End with one line naming the most
      useful next step (which child to fill in next), or skip if
      everything is already in good shape. Total length: under 120
      words. No headings, no preamble.
    `,
  },
  {
    id: 'refine',
    label: 'Refine focused item',
    hint: 'Rewrite the selected item after asking how',
    icon: 'mdi-auto-fix',
    requires: AgentMode.Edit,
    prompt: oneLine`
      Refine the focused item. First call
      ask_user_question to confirm what changes I want (tone, length,
      structure, anything I want fixed), then call respective edit tools
      depending on the item's entity and entity type.
    `,
  },
  {
    id: 'shorter',
    label: 'Make it shorter',
    hint: 'Compress the focused content element',
    icon: 'mdi-arrow-collapse-vertical',
    requires: AgentMode.Edit,
    prompt: oneLine`
      Refine the focused content element: keep the same meaning but
      make it about 30% shorter and more direct. Use refine_element.
    `,
  },
  {
    id: 'audit',
    label: 'Audit content',
    hint: 'List topics with missing or thin content',
    icon: 'mdi-clipboard-check-outline',
    requires: AgentMode.Inspect,
    prompt: oneLine`
      Audit the repository: walk the outline and list every activity
      with no content or only one short element. Group by parent.
    `,
  },
  {
    id: 'outline',
    label: 'Generate full outline',
    hint: 'Draft the entire activity tree for this repository',
    icon: 'mdi-file-tree',
    requires: AgentMode.Edit,
    prompt: oneLine`
      Generate a full outline for this repository. If the subject
      isn't obvious from the repository's name and description, ask
      me what subject to build it around via ask_user_question
      before calling generate_outline. Then call generate_outline
      followed by create_outline to persist.
    `,
  },
  {
    id: 'help',
    label: 'Help',
    hint: 'Show what the agent can do',
    icon: 'mdi-help-circle-outline',
    requires: AgentMode.Inspect,
    prompt: oneLine`
      Briefly list what tools you have available and what kinds of
      tasks I can ask of you in this repository.
    `,
  },
];

const props = defineProps<Props>();
const text = defineModel<string>({ required: true });
const emit = defineEmits<{ autorun: [prompt: string, label: string] }>();

const isOpen = ref(false);
const activeIndex = ref(0);

// Mirrors backend isToolAllowed(): Edit unlocks every command
const allowedCommands = computed<SlashCommand[]>(() => {
  if (props.mode === AgentMode.Edit) return COMMANDS;
  return COMMANDS.filter((command) => command.requires === AgentMode.Inspect);
});

// What the user typed after "/" - tracked only while the slash is the
// first character AND no space has been typed yet. `null` means the
// textarea isn't in slash-command mode.
const slashQuery = computed<string | null>(() => {
  const value = text.value;
  if (!value.startsWith('/')) return null;
  const rest = value.slice(1);
  if (rest.includes(' ')) return null;
  return rest.toLowerCase();
});

const visibleCommands = computed<SlashCommand[]>(() => {
  const q = slashQuery.value;
  if (q === null) return [];
  if (q === '') return allowedCommands.value;
  return allowedCommands.value.filter(
    (command) =>
      command.id.toLowerCase().includes(q) ||
      command.label.toLowerCase().includes(q),
  );
});

watch(slashQuery, (q) => {
  if (q === null) isOpen.value = false;
  else {
    isOpen.value = true;
    activeIndex.value = 0;
  }
});

function commit(command: SlashCommand) {
  isOpen.value = false;
  // Clear the input so the leading "/" doesn't bleed through to the
  // agent request, then dispatch the prompt immediately.
  text.value = '';
  emit('autorun', command.prompt, command.label);
}

function toggleMenu() {
  if (isOpen.value) {
    isOpen.value = false;
    // Clear the auto-inserted slash so a stale "/" doesn't linger in
    // the textarea after the user dismisses the menu without picking.
    if (text.value === '/') text.value = '';
    return;
  }
  // Inject "/" so the slashQuery watcher kicks in and renders all
  // commands; same flow as typing "/" manually in the textarea.
  text.value = '/';
}

/**
 * Handle a textarea keydown. Returns true when the menu consumed the
 * event (caller should preventDefault and skip its own handling).
 */
function handleKeydown(e: KeyboardEvent): boolean {
  if (!isOpen.value || !visibleCommands.value.length) return false;
  if (e.key === 'ArrowDown') {
    activeIndex.value = (activeIndex.value + 1) % visibleCommands.value.length;
    return true;
  }
  if (e.key === 'ArrowUp') {
    const len = visibleCommands.value.length;
    activeIndex.value = (activeIndex.value - 1 + len) % len;
    return true;
  }
  if (e.key === 'Enter' || e.key === 'Tab') {
    const command = visibleCommands.value[activeIndex.value];
    if (command) commit(command);
    return true;
  }
  if (e.key === 'Escape') {
    isOpen.value = false;
    text.value = '';
    return true;
  }
  return false;
}

defineExpose({ handleKeydown });
</script>

<style lang="scss" scoped>
.cmd-anchor {
  position: relative;
}

.agent-cmd-menu {
  overflow: hidden;
  min-width: 21.25rem;
  max-width: 25rem;
  border-radius: 1rem;
}

.cmd-list {
  overflow-y: auto;
  max-height: 28rem;
}

.cmd-id {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  font-family: Menlo, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

.cmd-footer {
  display: flex;
  justify-content: center;
  gap: 0.875rem;
  padding: 0.5rem 0.875rem 1rem;
  font-size: 0.6875rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
  }

  .v-hotkey {
    :deep(.v-kbd) {
      padding: 0.125rem 0.25rem;
      font-size: 0.625rem;
    }

    :deep(.v-hotkey__suffix) {
      font-size: 0.6875rem;
    }

    :deep(.v-hotkey__key-icon .v-icon) {
      font-size: 0.625rem;
    }
  }
}
</style>
