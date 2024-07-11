<template>
  <div class="d-flex align-center">
    <VIcon :color="color" :icon="icon" class="priority-icon mr-1" />
    {{ label }}
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

defineProps<{ label: string; icon: string; color: string }>();
</script>
