<!-- eslint-disable
  vuejs-accessibility/click-events-have-key-events,
  vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    :class="[
      element.changeSincePublish,
      {
        selected: activeUsers.length,
        focused: isFocused,
        diff: showPublishDiff,
        frame,
      },
    ]"
    class="content-element"
    @click="onSelect"
  >
    <div
      :class="{ visible: showPublishDiff && element.changeSincePublish }"
      class="header d-flex"
    >
      <PublishDiffChip
        :change-type="element.changeSincePublish"
        class="ml-auto"
      />
    </div>
    <ActiveUsers :size="20" :users="activeUsers" class="active-users" />
    <component
      :is="componentName"
      v-if="isComponentAvailable"
      v-bind="{
        ...$attrs,
        element,
        references,
        isFocused,
        isDragged,
        isDisabled,
        dense,
      }"
      :id="`element_${id.value}`"
      @add="emit('add', $event)"
      @delete="emit('delete')"
      @focus="onSelect"
      @link="onLink"
      @save="onSave"
    />
    <VSheet v-else class="py-10" color="primary-lighten-5">
      <div class="text-h6">
        {{ element.type.replace('_', ' ') }}
      </div>
      <div class="pt-4 text-subtitle-2">Component is not available!</div>
    </VSheet>
    <div v-if="!props.isDisabled" class="element-actions">
      <div
        v-if="showDiscussion"
        :class="{ 'is-visible': isHighlighted || hasComments }"
      >
        <ElementDiscussion v-bind="element" :user="currentUser" @open="focus" />
      </div>
      <div v-if="!parent" :class="{ 'is-visible': isHighlighted }">
        <VBtn
          aria-label="Delete element"
          class="mt-2"
          color="pink lighten-1"
          icon="mdi-delete-outline"
          size="x-small"
          variant="tonal"
          @click="emit('delete')"
        />
      </div>
    </div>
    <VProgressLinear
      v-if="isSaving"
      class="save-indicator"
      color="teal-accent-1"
      height="2"
      location="bottom"
      absolute
      indeterminate
    />
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
} from 'vue';
import { getComponentName, getElementId } from '@tailor-cms/utils';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { Meta } from '@tailor-cms/interfaces/common';
import type { User } from '@tailor-cms/interfaces/user';

import ActiveUsers from './ActiveUsers.vue';
import ElementDiscussion from './ElementDiscussion.vue';
import PublishDiffChip from './PublishDiffChip.vue';

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
}

const props = withDefaults(defineProps<Props>(), {
  references: null,
  parent: null,
  isHovered: false,
  isDragged: false,
  isDisabled: false,
  frame: true,
  dense: false,
  showDiscussion: false,
});

const emit = defineEmits(['add', 'delete', 'save', 'save:meta']);

const ceRegistry = inject<any>('$ceRegistry');
const editorBus = inject<any>('$editorBus');
const editorState = inject<any>('$editorState');
const eventBus = inject<any>('$eventBus');
const getCurrentUser = inject<any>('$getCurrentUser');

const elementBus = eventBus.channel(`element:${getElementId(props.element)}`);
provide('$elementBus', elementBus);

const isFocused = ref(false);
const isSaving = ref(false);
const currentUser = getCurrentUser?.();
const activeUsers = ref<User[]>([]);

const id = computed(() => getElementId(props.element));
const componentName = computed(() => getComponentName(props.element.type));
const isEmbed = computed(() => !!props.parent || !props.element.uid);
const isHighlighted = computed(() => isFocused.value || props.isHovered);
const hasComments = computed(() => !!props.element.comments?.length);
const showPublishDiff = computed(() => editorState?.isPublishDiff.value);
const isComponentAvailable = computed(
  () => !!ceRegistry.get(props.element.type),
);

onBeforeUnmount(() => {
  elementBus.destroy();
});

const onSelect = (e: any) => {
  if (!props.isDisabled && !showPublishDiff.value && !e.component) {
    focus();
    e.component = { name: 'content-element', data: props.element };
  }
};

const onSave = (data: ContentElement['data']) => {
  if (!isEmbed.value) isSaving.value = true;
  emit('save', data);
};

const focus = () => {
  editorBus.emit('element:focus', props.element, props.parent);
};

const onLink = (key?: string) => editorBus.emit('element:link', key);

onMounted(() => {
  elementBus.on('delete', () => emit('delete'));
  elementBus.on('save:meta', (meta: Meta) => emit('save:meta', meta));
  elementBus.on('save', (data: ContentElement['data']) =>
    emit('save', onSave(data)),
  );

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
@import '../mixins';

.content-element {
  $accent-1: #1de9b6;
  $accent-2: #ff4081;

  position: relative;
  border: 1px solid transparent;

  &::after {
    $width: 0.125rem;

    content: '';
    display: none;
    position: absolute;
    top: 0;
    right: -$width;
    width: $width;
    height: 100%;
  }

  &.focused {
    border: 1px dashed $accent-1;

    &::after {
      display: block;
      background: $accent-1;
    }
  }

  &.selected {
    border: 1px dashed $accent-2;

    &::after {
      display: block;
      background: $accent-2;
    }
  }
}

.frame {
  padding: 10px 20px;
  border: 1px solid #e1e1e1;
}

.element-actions {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: -0.0625rem;
  right: -2.5rem;
  width: 3rem;
  height: 100%;
  padding-left: 0.75rem;

  > * {
    min-height: 1.75rem;
    opacity: 0;
    transition: opacity 0.1s linear;
  }

  > .is-visible {
    opacity: 1;
    transition: opacity 0.5s linear;
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
    @include highlight(rgb(var(--v-theme-success-lighten-4)));
  }

  &.changed,
  &.removed {
    @include highlight(rgb(var(--v-theme-secondary-lighten-4)));
  }

  .element-actions {
    display: none;
  }
}
</style>
