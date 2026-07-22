<template>
  <div class="resolve-btn-container">
    <VBtn
      v-tooltip:left="{
        text: 'Mark all as resolved and hide discussion',
        openDelay: 800,
      }"
      v-bind="$attrs"
      prepend-icon="mdi-checkbox-outline"
      size="small"
      text="Resolve All"
      variant="tonal"
    />
  </div>
</template>
