<!-- eslint-disable
  vuejs-accessibility/click-events-have-key-events,
  vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    ref="rootEl"
    :class="[
      element.diffChange,
      {
        selected: activeUsers.length,
        focused: isFocused,
        diff: showDiff,
        frame,
        linked: element.isLinkedCopy && !showDiff,
      },
    ]"
    class="content-element rounded"
    @click="onSelect"
  >
    <div
      v-if="!isQuestion"
      :class="{ visible: showDiff && element.diffChange }"
      class="header d-flex"
    >
      <DiffChip :change-type="element.diffChange" class="ml-auto" />
    </div>
    <ActiveUsers :size="20" :users="activeUsers" class="active-users" />
    <VSheet
      v-if="loading"
      class="py-16 text-title-small text-center"
      rounded="lg"
    >
      <CircularProgress />
      <div class="pt-3 font-weight-bold">
        <span>Content generation in progress...</span>
      </div>
    </VSheet>
    <template v-else>
      <template v-if="!!manifest">
        <QuestionElement
          v-if="isQuestion"
          :icon="manifest.ui.icon"
          :type="manifest.name"
          v-bind="{
            ...$attrs,
            componentName,
            embedElementConfig,
            element,
            references,
            isFocused,
            isDragged,
            isDisabled,
            isReadonly: props.isDisabled,
            dense,
            autosave,
          }"
          @add="emit('add', $event)"
          @delete="emit('delete')"
          @focus="onSelect"
          @generate="generateContent"
          @link="onLinkRelationship"
          @reset="reset"
          @save="onSave"
        />
        <component
          :is="componentName"
          v-else
          v-bind="{
            ...$attrs,
            embedElementConfig,
            element,
            references,
            isFocused,
            isDragged,
            isDisabled,
            isReadonly: props.isDisabled,
            dense,
          }"
          :id="`element_${id}`"
          @add="emit('add', $event)"
          @delete="emit('delete')"
          @focus="onSelect"
          @link="onLinkRelationship"
          @save="onSave"
        />
      </template>
      <VSheet v-else class="py-10">
        <div class="text-title-large">
          {{ (element.type || 'Unknown').replace('_', ' ') }}
        </div>
        <div class="pt-4 text-title-small">Component is not available!</div>
      </VSheet>
    </template>
    <div
      v-if="!props.isDisabled"
      :class="['element-actions', { comfortable: isComfortable }]"
    >
      <div
        v-if="element.isLinkedCopy"
        :class="{ 'is-visible': isHighlighted || element.isLinkedCopy }"
      >
        <ElementLinkedIndicator
          :is-entry-point="isElementEntryPoint"
          :is-loading="isLoadingSourceInfo"
          :source-info="linkedSourceInfo"
          @source:fetch="onFetchSource"
          @source:view="onNavigateToElement"
          @unlink="onUnlink"
        />
      </div>
      <div v-if="showSourceUsages" :class="{ 'is-visible': isHighlighted }">
        <ElementSourceUsages
          :element="element"
          :usages="sourceUsages"
          :is-loading="isLoadingSourceUsages"
          @usages:fetch="onFetchCopies"
          @usage:view="onNavigateToElement"
        />
      </div>
      <div
        v-if="showDiscussion"
        :class="{
          'is-visible': isHighlighted || hasComments,
          'pinned-first': hasComments,
        }"
      >
        <ElementLinkedDiscussion
          v-if="props.element.isLinkedCopy"
          :is-loading="isLoadingSourceInfo"
          :source-info="linkedSourceInfo"
          @source:fetch="onFetchSource"
          @source:view="onNavigateToElement"
        />
        <ElementDiscussion
          v-else
          v-bind="element"
          :user="currentUser"
          @open="focus"
        />
      </div>
      <div :class="{ 'is-visible': isHighlighted }">
        <VBtn
          v-tooltip:left="{ text: 'Reset element', openDelay: 1000 }"
          aria-label="Reset element"
          color="warning"
          icon="mdi-restore"
          size="x-small"
          variant="tonal"
          @click="reset"
        />
      </div>
      <div v-if="!parent" :class="{ 'is-visible': isHighlighted }">
        <VBtn
          v-tooltip:left="{ text: 'Delete element', openDelay: 1000 }"
          aria-label="Delete element"
          color="error"
          icon="mdi-trash-can-outline"
          size="x-small"
          variant="tonal"
          @click="emit('delete')"
        />
      </div>
    </div>
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
} from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { AiRequestType } from '@tailor-cms/interfaces/ai';
import { cloneDeep } from 'lodash-es';
import { getElementId } from '@tailor-cms/utils';

import ActiveUsers from './ActiveUsers.vue';
import CircularProgress from './CircularProgress.vue';
import DiffChip from './DiffChip.vue';
import ElementDiscussion from './ElementDiscussion.vue';
import ElementLinkedDiscussion from './ElementLinkedDiscussion.vue';
import ElementLinkedIndicator from './ElementLinkedIndicator.vue';
import ElementSourceUsages from './ElementSourceUsages.vue';
import QuestionElement from './QuestionElement.vue';
import { useConfirmationDialog } from '../composables/useConfirmationDialog';
import { useLoader } from '../composables/useLoader';

interface Props {
  element: ContentElement;
  references?: Record<string, ContentElement[]> | null;
  parent?: Activity | null;
  isHovered?: boolean;
  isDragged?: boolean;
  isDisabled?: boolean;
  frame?: boolean;
  dense?: boolean;
  showDiscussion?: boolean;
  embedElementConfig?: ContentElementCategory[];
  autosave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  embedElementConfig: () => [],
  references: null,
  parent: null,
  isHovered: false,
  isDragged: false,
  isDisabled: false,
  frame: true,
  dense: false,
  showDiscussion: false,
  autosave: false,
});

const emit = defineEmits(['add', 'delete', 'save', 'save:meta']);

const ceRegistry = inject<any>('$ceRegistry');
const editorBus = inject<any>('$editorBus');
const editorState = inject<any>('$editorState');
const eventBus = inject<any>('$eventBus');
const getCurrentUser = inject<any>('$getCurrentUser');
const doTheMagic = inject<any>('$doTheMagic');
const rpc = inject<any>('$rpc', null);

const { loading, loader } = useLoader();
const confirmationDialog = useConfirmationDialog();

const elementBus = eventBus.channel(`element:${getElementId(props.element)}`);
provide('$elementBus', elementBus);

if (rpc) {
  provide('$rpc', (procedure: string, payload?: any) =>
    rpc(props.element.type, procedure, payload),
  );
}

const isFocused = ref(false);
const isSaving = ref(false);
const currentUser = getCurrentUser?.();
const activeUsers = ref<User[]>([]);
const rootEl = ref<HTMLElement | null>(null);

const id = computed(() => getElementId(props.element));
const manifest = computed(() => ceRegistry.getByEntity(props.element));
const componentName = computed(() => manifest.value?.componentName);
const isEmbed = computed(() => !!props.parent || !props.element.uid);
const isHighlighted = computed(() => isFocused.value || props.isHovered);
const hasComments = computed(() => !!props.element.comments?.length);
const showDiff = computed(() => editorState?.showDiff.value);
const isQuestion = computed(() => manifest.value?.isQuestion || false);

// Linked element state
const isElementEntryPoint = ref(true);
const isLoadingSourceInfo = ref(false);
const linkedSourceInfo = ref<ElementSourceInfo | null>(null);

// Source usages state (for non-linked elements that could have copies)
const isLoadingSourceUsages = ref(false);
const sourceUsages = ref<ElementSourceInfo[] | null>(null);
const showSourceUsages = computed(
  () => !props.element.isLinkedCopy && !props.element.embedded,
);

// The action column relaxes its vertical spacing once the host
// element is tall enough.
const COMFORTABLE_MIN_HEIGHT = 130;
const isComfortable = ref(false);
useResizeObserver(rootEl, ([entry]) => {
  if (!entry) return;
  const height = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;
  const comfortable = height >= COMFORTABLE_MIN_HEIGHT;
  if (comfortable !== isComfortable.value) isComfortable.value = comfortable;
});

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
  if (!ceRegistry) return;
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

const generateContent = loader(async function (text) {
  const data = cloneDeep(props.element.data);
  const inputs = [{
    type: AiRequestType.Modify,
    text: text ?? 'Generate content element for this page.',
    responseSchema: props.element.type,
    content: JSON.stringify(props.element.data),
  }];
  const generatedContent = await doTheMagic({ inputs });
  return onSave({ ...data, ...generatedContent });
});

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
@use '../mixins';

.content-element {
  $accent-focused: #1de9b6;
  $accent-selected: #ff4081;

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
    background: rgba(var(--v-theme-tertiary-container), 0.2);
    pointer-events: none;
  }
}

.frame {
  padding: 10px 20px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.element-actions {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  position: absolute;
  top: -0.0625rem;
  right: -2.5rem;
  width: 3rem;
  height: 100%;
  padding-left: 0.75rem;

  > * {
    flex-shrink: 0;
    min-height: 1.5rem;
    opacity: 0;
    transition: opacity 0.1s linear;
  }

  > .is-visible {
    opacity: 1;
    transition: opacity 0.5s linear;
  }

  // With comments the icon stays visible while the row isn't hovered, so
  // pin it to the top instead of leaving it below hidden hover-only actions.
  > .pinned-first {
    order: -1;
  }

  // More of vertical spacing when the host element has room; compact hosts
  // keep the tight stack.
  &.comfortable {
    gap: 0.625rem;
  }

  :deep(.v-btn--icon.v-btn--size-x-small) {
    --v-btn-height: 0.875rem;
  }

  :deep(.v-btn--size-x-small .v-icon) {
    font-size: 1.25rem;
  }
}

.active-users {
  position: absolute;
  top: 0;
  left: -1.625rem;
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
