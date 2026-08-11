<!-- eslint-disable
  vuejs-accessibility/click-events-have-key-events,
  vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    :id="`element_${id}`"
    ref="rootEl"
    :class="[
      element.diffChange,
      isField ? 'field rounded' : 'card rounded-lg',
      {
        quiet: isQuiet,
        selected: activeUsers.length,
        focused: isFocused,
        diff: showDiff,
        linked: element.isLinkedCopy && !showDiff,
      },
    ]"
    class="content-element"
    @click="onSelect"
  >
    <ActiveUsersGroup
      v-if="isField && activeUsers.length"
      :size="24"
      :users="activeUsers"
      class="active-users-overlay"
    />
    <div
      v-if="!isField"
      :class="{ revealed: isHighlighted || activeUsers.length }"
      class="header-reveal"
    >
      <div
        :class="{ expanded: isExpanded }"
        class="card-header d-flex align-center"
        @click="toggleExpanded"
      >
        <span v-if="!isDisabled && isDraggable" class="drag-handle" @click.stop>
          <span class="mdi mdi-drag-vertical"></span>
        </span>
        <div
          :class="{ 'ml-2': isDisabled || !isDraggable }"
          class="type-label d-flex align-center flex-shrink-0"
        >
          <VIcon
            :color="isRegistered ? 'secondary' : 'warning'"
            :icon="typeIcon"
            size="x-small"
            start
          />
          <span class="text-label-small font-weight-semibold text-uppercase">
            {{ typeName }}
          </span>
        </div>
        <template v-if="!isExpanded">
          <span
            v-if="preview"
            class="mx-3 text-medium-emphasis text-body-medium text-truncate"
          >
            {{ preview }}
          </span>
          <span
            v-else-if="isElementEmpty"
            class="mx-3 font-italic text-disabled text-body-medium"
          >
            Empty
          </span>
        </template>
        <VSpacer />
        <ActiveUsersGroup
          v-if="activeUsers.length"
          :size="24"
          :users="activeUsers"
          class="active-users"
        />
        <DiffChip :change-type="element.diffChange" />
        <div v-if="!props.isDisabled" @click.stop>
          <ElementActions
            v-bind="actionBindings"
            @delete="emit('delete')"
            @discussion:open="focus"
            @navigate="onNavigateToElement"
            @reset="reset"
            @source:fetch="onFetchSource"
            @unlink="onUnlink"
            @usages:fetch="onFetchCopies"
          />
        </div>
        <VBtn
          v-if="!isQuiet"
          :aria-label="isExpanded ? 'Collapse element' : 'Expand element'"
          :icon="`mdi-chevron-${isExpanded ? 'up' : 'down'}`"
          class="ml-1 flex-shrink-0 chevron"
          density="comfortable"
          size="small"
          variant="text"
          @click.stop="toggleExpanded"
        />
      </div>
    </div>
    <DeprecationWarning
      v-if="!isDisabled && isDeprecated(element.type)"
      :element="element"
      class="ma-3"
    />
    <VExpandTransition>
      <div v-show="isExpanded">
        <div class="card-body">
          <QuestionElement
            v-if="isQuestion"
            v-bind="{ ...editBindings, componentName, autosave, isDirty }"
            @add="emit('add', $event)"
            @delete="emit('delete')"
            @focus="onSelect"
            @link="onLinkRelationship"
            @save="onSave"
          >
            <slot></slot>
          </QuestionElement>
          <template v-else-if="isRegistered">
            <slot></slot>
            <component
              :is="componentName"
              v-bind="editBindings"
              @add="emit('add', $event)"
              @delete="emit('delete')"
              @focus="onSelect"
              @link="onLinkRelationship"
              @save="onSave"
            />
          </template>
          <ElementPlaceholder
            v-else
            color="warning"
            icon="mdi-alert-circle-outline"
            name="Component is not available"
            placeholder="No editor is registered for this element type."
          />
        </div>
      </div>
    </VExpandTransition>
    <VProgressLinear
      v-if="isSaving"
      class="save-indicator"
      color="secondary"
      height="2"
      location="bottom"
      absolute
      indeterminate
    />
  </div>
</template>

<script lang="ts" setup>
import type {
  ContentElement,
  ElementSourceInfo,
} from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';
import type { Meta } from '@tailor-cms/interfaces/common';
import type { User } from '@tailor-cms/interfaces/user';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useAttrs,
  watch,
} from 'vue';
import { isEqual } from 'lodash-es';
import { useElementHover, useFocusWithin } from '@vueuse/core';
import {
  getElementId,
  getQuestionPromptPreview,
  htmlToText,
  titleCase,
} from '@tailor-cms/utils';

import ActiveUsersGroup from '../ActiveUsersGroup.vue';
import DiffChip from './DiffChip.vue';
import DeprecationWarning from '../DeprecationWarning.vue';
import ElementActions from './ElementActions/index.vue';
import ElementPlaceholder from '../ElementPlaceholder.vue';
import { isDeprecated } from '../../utils/deprecated-elements';
import QuestionElement from '../QuestionElement/index.vue';
import { useConfirmationDialog } from '../../composables/useConfirmationDialog';

interface Props {
  element: ContentElement;
  references?: Record<string, ContentElement[]> | null;
  parent?: Activity | null;
  expanded?: boolean | null;
  isDragged?: boolean;
  isDraggable?: boolean;
  isDisabled?: boolean;
  // External dirty state (e.g. edited element refs); shows the save
  // controls and lets a save through even when element data is unchanged.
  isDirty?: boolean;
  showDiscussion?: boolean;
  embedElementConfig?: ContentElementCategory[];
  autosave?: boolean;
  // 'card': standard editor card. 'field': header-less body for
  // externally-labelled slots. 'quiet': header hidden until hover/focus;
  // always expanded, no chevron.
  variant?: 'card' | 'field' | 'quiet';
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  parent: null,
  // Controlled card expansion; null keeps it locally managed.
  expanded: null,
  isDragged: false,
  isDraggable: true,
  isDisabled: false,
  isDirty: false,
  showDiscussion: false,
  autosave: false,
  variant: 'card',
});

const emit = defineEmits([
  'add',
  'delete',
  'save',
  'save:meta',
  'update:expanded',
]);

const ceRegistry = inject<any>('$ceRegistry');
const editorBus = inject<any>('$editorBus');
const editorState = inject<any>('$editorState');
const eventBus = inject<any>('$eventBus');
const getCurrentUser = inject<() => User | null>('$getCurrentUser', () => null);

const rpc = inject<any>('$rpc', null);

const confirmationDialog = useConfirmationDialog();

const elementBus = eventBus.channel(`element:${getElementId(props.element)}`);
provide('$elementBus', elementBus);

if (rpc) {
  provide('$rpc', (procedure: string, payload?: any) =>
    rpc(props.element.type, procedure, payload),
  );
}

const rootEl = ref<HTMLElement | null>(null);
const isHovered = useElementHover(rootEl);
const { focused: isFocusWithin } = useFocusWithin(rootEl);

const isFocused = ref(false);
const isSaving = ref(false);
const currentUser = getCurrentUser();
const activeUsers = ref<User[]>([]);

const id = computed(() => getElementId(props.element));
const manifest = computed(() => ceRegistry.getByEntity(props.element));
const isRegistered = computed(() => !!manifest.value);
const componentName = computed(() => manifest.value?.componentName);
const isEmbed = computed(() => !!props.parent || !props.element.uid);
const isHighlighted = computed(
  () => isFocused.value || isHovered.value || isFocusWithin.value,
);
const showDiff = computed(() => editorState?.showDiff.value);
const isQuestion = computed(() => manifest.value?.isQuestion || false);

const attrs = useAttrs();

const localExpanded = ref(props.expanded ?? true);
const isField = computed(() => props.variant === 'field');
const isQuiet = computed(() => props.variant === 'quiet');
const isExpanded = computed(() => {
  if (isField.value || isQuiet.value) return true;
  return localExpanded.value;
});

const typeIcon = computed(() => manifest.value?.ui?.icon ?? 'mdi-alert-circle-outline');
const typeName = computed(
  () => manifest.value?.name ?? titleCase(props.element.type || 'Unknown'),
);

const preview = computed(() => {
  if (isQuestion.value) return questionPreview.value;
  const content = props.element.data?.content;
  if (typeof content !== 'string') return '';
  return htmlToText(content);
});

const questionPreview = computed(() => {
  const { embeds, question } = props.element.data as any;
  if (!Array.isArray(question) || !embeds) return '';
  const prompt = question.map((id: string) => embeds[id]).filter(Boolean);
  return getQuestionPromptPreview(prompt);
});

const isElementEmpty = computed(
  () => !!manifest.value?.isEmpty?.(props.element.data),
);

const editBindings = computed(() => ({
  ...attrs,
  embedElementConfig: props.embedElementConfig,
  element: props.element,
  references: props.references,
  isFocused: isFocused.value,
  isDragged: props.isDragged,
  isDisabled: props.isDisabled,
  isReadonly: props.isDisabled,
}));

const actionBindings = computed(() => ({
  currentUser,
  element: props.element,
  isEntryPoint: isElementEntryPoint.value,
  isHighlighted: isHighlighted.value,
  isLoadingSourceInfo: isLoadingSourceInfo.value,
  isLoadingUsages: isLoadingSourceUsages.value,
  linkedSourceInfo: linkedSourceInfo.value,
  showDelete: !props.parent,
  showDiscussion: props.showDiscussion,
  isRegistered: isRegistered.value,
  usages: sourceUsages.value,
}));

// Linked element state
const isElementEntryPoint = ref(true);
const isLoadingSourceInfo = ref(false);
const linkedSourceInfo = ref<ElementSourceInfo | null>(null);

// Source usages state (for non-linked elements that could have copies)
const isLoadingSourceUsages = ref(false);
const sourceUsages = ref<ElementSourceInfo[] | null>(null);

const toggleExpanded = () => {
  localExpanded.value = !localExpanded.value;
  emit('update:expanded', localExpanded.value);
};

const onSelect = (e: any) => {
  if (!props.isDisabled && !showDiff.value && !e.component) {
    focus();
    e.component = { name: 'content-element', data: props.element };
  }
};

const focus = () => {
  if (props.isDisabled) return;
  const { element, parent } = props;
  editorBus.emit('element:focus', { ...element, parent });
};

const onSave = (data: ContentElement['data']) => {
  if (props.isDisabled) return;
  // Editors re-emit `save` on blur even when nothing changed; skip persisting
  // (and its "saved" toast) when the payload matches the stored data.
  if (!props.isDirty && isEqual(data, props.element.data)) return;
  if (props.element.isLinkedCopy && !isEmbed.value) {
    confirmationDialog({
      title: 'Edit linked element?',
      color: 'warning',
      message:
        `This element is linked. Editing will unlink it and you ` +
        `will no longer receive updates. Do you want to continue?`,
      action: () => {
        isSaving.value = true;
        emit('save', data);
      },
    });
    return;
  }
  if (!isEmbed.value) isSaving.value = true;
  emit('save', data);
};

const reset = () => {
  if (!ceRegistry || !isRegistered.value) return;
  confirmationDialog({
    title: 'Reset element?',
    color: 'warning',
    message: 'Are you sure you want to reset element to its initial state?',
    action: () => {
      const data = ceRegistry.resetData(props.element);
      return onSave(data);
    },
  });
};

// Element relationships (refs between elements)
const onLinkRelationship = (key?: string) => editorBus.emit('element:link', key);

const onUnlink = () => {
  confirmationDialog({
    title: 'Unlink element?',
    color: 'warning',
    message:
      `This will convert the element to a local copy. ` +
      `You will no longer receive updates. Do you want to continue?`,
    action: () => editorBus.emit('element:unlink', props.element),
  });
};

const onFetchSource = () => {
  isLoadingSourceInfo.value = true;
  editorBus.emit('element:fetchSource', {
    element: props.element,
    callback: (sourceInfo: typeof linkedSourceInfo.value) => {
      linkedSourceInfo.value = sourceInfo;
      isLoadingSourceInfo.value = false;
    },
  });
};

const onFetchCopies = () => {
  isLoadingSourceUsages.value = true;
  editorBus.emit('element:fetchCopies', {
    element: props.element,
    callback: (usages: typeof sourceUsages.value) => {
      sourceUsages.value = usages;
      isLoadingSourceUsages.value = false;
    },
  });
};

const onNavigateToElement = (location: {
  repositoryId: number;
  outlineActivityId: number;
  uid?: string;
}) => {
  editorBus.emit('element:navigate', location);
};

const initLinking = () => {
  if (!props.element.isLinkedCopy) return;
  // Check if element is entry point (linked directly)
  // or nested (linked via parent)
  editorBus.emit('element:isLinkedViaParent', {
    element: props.element,
    callback: (isLinkedViaParent: boolean) => {
      isElementEntryPoint.value = !isLinkedViaParent;
    },
  });
};

watch(
  () => props.expanded,
  (val) => {
    if (val !== null) localExpanded.value = val;
  },
);

onBeforeUnmount(() => {
  elementBus.destroy();
});

onMounted(() => {
  initLinking();

  elementBus.on('delete', () => emit('delete'));
  elementBus.on('save:meta', (meta: Meta) => emit('save:meta', meta));
  elementBus.on('save', onSave);

  const deferSaveFlag = () => setTimeout(() => (isSaving.value = false), 1000);
  elementBus.on('saved', deferSaveFlag);

  editorBus.on(
    'element:select',
    ({
      elementId,
      isSelected = true,
      user,
    }: {
      elementId: string;
      isSelected: boolean;
      user: User;
    }) => {
      // If not this element; return
      if (id.value !== elementId) return;
      // If selection event by the current user; handle focus & return
      if (!user || user?.id === currentUser?.id) {
        if (isSelected) focus();
        else isFocused.value = false;
        return;
      }
      // If other user; update active users
      if (isSelected && !activeUsers.value.find((it) => it.id === user.id)) {
        activeUsers.value.push(user);
      } else if (
        !isSelected &&
        activeUsers.value.find((it) => it.id === user.id)
      ) {
        activeUsers.value = activeUsers.value.filter((it) => it.id !== user.id);
      }
    },
  );

  editorBus.on('element:focus', (element: ContentElement) => {
    isFocused.value = !!element && getElementId(element) === id.value;
  });
});
</script>

<style lang="scss" scoped>
@use '../../mixins';

$accent-focused: #1de9b6;
$accent-selected: #ff4081;

.content-element {
  position: relative;
  border: 1px solid transparent;

  &::after {
    $width: 0.125rem;

    content: '';
    display: none;
    position: absolute;
    inset: 0 (-$width) 0 0;
    border-right: $width solid;
    border-radius: inherit;
    pointer-events: none;
  }

  &.focused {
    border: 1px dashed $accent-focused;

    &::after {
      display: block;
      border-color: $accent-focused;
    }
  }

  &.selected {
    border: 1px dashed $accent-selected;

    &::after {
      display: block;
      border-color: $accent-selected;
    }
  }

  &.linked::before {
    content: '';
    display: block;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(var(--v-theme-secondary-container), 0.2);
    pointer-events: none;
  }
}

.card {
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  background: rgb(var(--v-theme-surface-raised));
}

.field {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  padding: 1rem;

  .card-body, :deep(.tiptap) {
    padding: 0;
  }
}

.quiet .header-reveal {
  height: 0;
  overflow: hidden;
  transition: height 0.2s ease;

  &.revealed {
    height: 2.75rem;
  }
}

.card-header {
  min-height: 2.75rem;
  padding: 0.375rem 0.5rem 0.375rem 0.25rem;
  cursor: pointer;

  &.expanded {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
  }

  .drag-handle {
    flex-shrink: 0;
    width: 1.5rem;
    cursor: grab;

    .mdi {
      color: rgba(var(--v-theme-on-surface), 0.4);
      font-size: 1.25rem;
    }
  }

  .chevron {
    border-radius: 8px;
    color: rgba(var(--v-theme-on-surface), 0.65);
  }

  .type-label {
    color: rgb(var(--v-theme-on-surface));
    letter-spacing: 0.05em;
  }
}

.card-body {
  padding: 0.625rem 1.25rem 1rem;
}

.active-users {
  flex-shrink: 0;
  margin-right: 0.5rem;

  :deep(.v-avatar) {
    border-color: $accent-selected;
  }
}

.active-users-overlay {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
}

.save-indicator {
  position: absolute;
  left: 0;
}

.header {
  width: 100%;
  max-height: 0;

  &.visible {
    max-height: unset;
    padding: 0 0 0.5rem;
  }
}

.diff {
  &.new {
    @include mixins.highlight(rgb(var(--v-theme-success-container)));
  }

  &.changed {
    @include mixins.highlight(rgb(var(--v-theme-warning-container)));
  }

  &.removed {
    @include mixins.highlight(rgb(var(--v-theme-error-container)));
  }

  .element-actions {
    display: none;
  }
}
</style>
