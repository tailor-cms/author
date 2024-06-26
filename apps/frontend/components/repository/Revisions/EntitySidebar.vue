<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="sidebar">
    <div class="header">Changes</div>
    <div ref="revisions" class="revision-list">
      <transition-group name="fade-in">
        <span
          v-for="(revision, index) in revisions"
          :key="revision.id"
          :class="{ selected: isSelected(revision) }"
          class="revision"
          @click="$emit('preview', revision)"
        >
          <div class="description">
            <div>{{ formatDate(revision) }}</div>
            <div>{{ revision.user.label }}</div>
          </div>
          <div
            v-show="!isDetached && index > 0 && !revision.loading"
            class="rollback"
            @click.stop="$emit('rollback', revision)"
          >
            <span class="mdi mdi-restore"></span>
          </div>
          <div v-show="revision.loading">
            <div class="progress-background"></div>
            <div class="progress-indicator"></div>
          </div>
        </span>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { format } from 'fecha';
import type { Revision } from '@tailor-cms/interfaces/revision';

interface Props {
  revisions?: Revision[];
  selected?: Revision | null;
  isDetached?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  revisions: () => [],
  selected: null,
  isDetached: false,
});
defineEmits(['preview', 'rollback']);

const isSelected = (revision: Revision) => {
  return props.selected?.id === revision.id;
};

const formatDate = (revision: Revision) => {
  return format(new Date(revision.createdAt), 'M/D/YY h:mm A');
};
</script>

<style lang="scss" scoped>
$revision-padding: 2rem;

@mixin selected-revision {
  background-color: #37474f;
  color: #fff;
}

.sidebar {
  flex: 0 0 20rem;
}

.header {
  margin: 8px 0;
  padding-left: $revision-padding;
  color: #808080;
}

.revision-list {
  max-height: 31.25rem;
  padding: 0;
  overflow-y: auto;
}

.revision {
  position: relative;
  display: flex;
  overflow: hidden;
  height: 3.25rem;
  padding-left: $revision-padding;
  cursor: pointer;
  font-size: 0.875rem;
  color: #656565;
  flex-direction: row;
  align-items: center;

  &:hover {
    background-color: #f1f1f1;
    color: #333;
  }

  .description {
    width: 225px;
  }

  .rollback {
    display: none;
  }
}

.selected,
.revision:hover {
  .rollback {
    display: flex;
    margin-right: 0.5rem;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    justify-content: center;
    align-items: center;

    &:hover {
      color: #222;
    }

    .mdi {
      font-size: 1.125rem;
    }
  }
}

.selected.revision:hover {
  @include selected-revision;

  .rollback:hover {
    background-color: #ddd;
  }
}

.fade-in-enter {
  opacity: 0;
  transform: scale(0.8);
}

.fade-in-enter-active {
  transition: all 250ms cubic-bezier(0, 0.8, 0.32, 1.07);
}

.progress-background,
.progress-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0.125rem;
  background-color: #757575;
}

.progress-background {
  opacity: 0.2;
}

.progress-indicator {
  animation: indeterminate 1.2s infinite;
  width: 5rem;
}

.selected {
  @include selected-revision;

  .progress-background {
    opacity: 1;
  }

  .progress-indicator {
    background-color: #e91e63;
  }
}

@keyframes indeterminate {
  0% {
    right: 100%;
    left: -90%;
  }

  100% {
    right: -35%;
    left: 100%;
  }
}
</style>
