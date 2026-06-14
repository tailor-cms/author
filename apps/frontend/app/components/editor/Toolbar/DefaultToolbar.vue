<template>
  <div class="text-title-medium font-weight-medium">
    {{ label }}
  </div>
</template>

<script lang="ts" setup>
defineProps<{ label: string }>();
</script>
