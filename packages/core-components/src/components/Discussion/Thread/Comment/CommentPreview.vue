<template>
  <div :class="{ resolved: isResolved }" class="content mt-1 text-body-medium">
    <span v-if="isDeleted" class="deleted">
      This comment was deleted.
    </span>
    <template v-else>
      <div v-if="isResolved" class="resolvement-options">
        <span class="font-italic mr-1">Marked as resolved.</span>
        <VBtn
          v-tooltip:right="{ text: 'Unresolve comment', openDelay: 800 }"
          class="ml-1"
          color="tertiary"
          size="x-small"
          text="Undo"
          variant="tonal"
          @click.stop="emit('unresolve')"
        />
      </div>
      <div class="body">
        {{ content.trimEnd() }}
        <span v-if="isEdited" class="edited text-medium-emphasis">(edited)</span>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  content?: string;
  isResolved?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
}

withDefaults(defineProps<Props>(), {
  content: '',
  isResolved: false,
  isDeleted: false,
  isEdited: false,
});

const emit = defineEmits(['unresolve']);
</script>

<style lang="scss" scoped>
.edited {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.content .body {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

.content.resolved {
  opacity: 0.7;

  .resolvement-options {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
  }
}
</style>
