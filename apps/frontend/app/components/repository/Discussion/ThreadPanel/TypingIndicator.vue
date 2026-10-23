<template>
  <div
    class="typing-indicator d-flex align-center text-body-small text-medium-emphasis"
    role="status"
  >
    <VFadeTransition>
      <div v-if="names.length">
        <span v-if="names.length > 2">Several people are typing...</span>
        <span v-else>
          <span class="font-weight-medium">{{ names[0] }}</span>
          <template v-if="names[1]">
            and <span class="font-weight-medium">{{ names[1] }}</span>
            are typing...
          </template>
          <template v-else> is typing...</template>
        </span>
      </div>
    </VFadeTransition>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ users: { label: string }[] }>();

const names = computed(() => props.users.map((it) => it.label));
</script>

<style lang="scss" scoped>
.typing-indicator {
  height: 1.5rem;
}
</style>
