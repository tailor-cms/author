<template>
  <VChip :color="color" size="small">{{ label }}</VChip>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

defineProps<{ label: string; color: string }>();
</script>
