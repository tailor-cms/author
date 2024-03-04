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
        diff: false, // editorStore.isPublishDiff,
        frame,
      },
    ]"
    class="content-element"
    @click="onSelect"
  >
    <!-- TODO: Add upon publish diff implementation -->
    <!-- <div
      :class="{ visible: editorState.isPublishDiff && element.changeSincePublish }"
      class="header d-flex">
      <PublishDiffChip
        :change-type="element.changeSincePublish"
        class="ml-auto " />
    </div> -->
    <!-- TODO: Enable upon user activity tracking implementation -->
    <!-- <ActiveUsers :users="activeUsers" :size="20" class="active-users" /> -->
    <component
      v-bind="{
        ...$attrs,
        element,
        isFocused,
        isDragged,
        isDisabled,
        dense,
      }"
      :is="componentName"
      :id="`element_${id.value}`"
      @add="emit('add', $event)"
      @delete="emit('delete')"
      @focus="onSelect"
      @save="onSave"
    />
    <div v-if="!props.isDisabled" class="element-actions">
      <!-- TODO: Add upon Discussion implementation -->
      <!-- <div
        v-if="props.showDiscussion"
        :class="{ 'is-visible': isHighlighted.value || hasComments.value }">
        <Discussion @open="focus" v-bind="element" :user="currentUser.value" />
      </div> -->
      <div v-if="!parent" :class="{ 'is-visible': isHighlighted }">
        <VBtn
          color="pink lighten-1"
          icon="mdi-delete-outline"
          size="small"
          variant="text"
          @click="emit('delete')"
        />
      </div>
    </div>
    <VProgressLinear
      v-if="isSaving"
      class="save-indicator"
      color="teal accent-2"
      height="2"
      indeterminate
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, defineEmits, inject, onMounted, provide, ref } from 'vue';
import { getComponentName, getElementId } from '@tailor-cms/utils';
// TODO: Add upon user activity tracking & discussion implementation
// import ActiveUsers from './ActiveUsers.vue';
// import Discussion from './ElementDiscussion.vue';
// import PublishDiffChip from './PublishDiffChip.vue';

const props = defineProps({
  element: { type: Object, required: true },
  parent: { type: Object, default: null },
  isHovered: { type: Boolean, default: false },
  isDragged: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  frame: { type: Boolean, default: true },
  dense: { type: Boolean, default: false },
  showDiscussion: { type: Boolean, default: false },
});

const emit = defineEmits(['add', 'delete', 'save', 'save:meta']);

const editorBus = inject('$editorBus') as any;
const eventBus = inject('$eventBus') as any;
const elementBus = computed(() => eventBus.channel(`element:${id.value}`));

const isFocused = ref(false);
const isSaving = ref(false);
const activeUsers = ref<any[]>([]);

const id = computed(() => getElementId(props.element));
const componentName = computed(() => getComponentName(props.element.type));
const isEmbed = computed(() => !!props.parent || !props.element.uid);
const isHighlighted = computed(() => isFocused.value || props.isHovered);
// TODO: Add upon collab feature implementation
// const hasComments = computed(() => !!props.element.comments?.length);
const currentUser = computed(() => null); // $getCurrentUser()

const onSelect = (e) => {
  if (props.isDisabled || e.component) return; // || editorState.isPublishDiff
  focus();
  e.component = { name: 'content-element', data: props.element };
};

const onSave = (data) => {
  if (!isEmbed.value) isSaving.value = true;
  emit('save', data);
};

const focus = () => {
  editorBus.emit('element:focus', props.element, props.parent);
};

onMounted(() => {
  provide('$elementBus', elementBus.value);

  elementBus.value.on('delete', () => emit('delete'));
  elementBus.value.on('save:meta', (meta) => emit('save:meta', meta));

  const deferSaveFlag = () => setTimeout(() => (isSaving.value = false), 1000);
  elementBus.value.on('saved', deferSaveFlag);

  editorBus.on('element:select', ({ elementId, isSelected = true, user }) => {
    if (id.value !== elementId) return;
    if (!user || user.id === currentUser.value?.id) {
      isFocused.value = isSelected;
      if (isSelected) focus();
      return;
    }
    if (isSelected && !activeUsers.value.find((it: any) => it.id === user.id)) {
      activeUsers.value.push(user);
    } else if (
      !isSelected &&
      activeUsers.value.find((it) => it.id === user.id)
    ) {
      activeUsers.value = activeUsers.value.filter((it) => it.id !== user.id);
    }
  });

  editorBus.on('element:focus', (element) => {
    isFocused.value = !!element && getElementId(element) === id.value;
  });
});
</script>

<style lang="scss" scoped>
@import '../mixins';

.content-element {
  text-align: left;

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
  right: -1.25rem;
  width: 1.5rem;
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
  bottom: -0.125rem;
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
    @include highlight(var(--v-success-lighten2));
  }

  &.changed,
  &.removed {
    @include highlight(var(--v-secondary-lighten4));
  }

  .element-actions {
    display: none;
  }
}
</style>
