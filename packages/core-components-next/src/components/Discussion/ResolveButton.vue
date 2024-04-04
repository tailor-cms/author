<template>
  <div class="resolve-btn-container">
    <VTooltip location="left" open-delay="800">
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="{ ...$attrs, ...tooltipProps }"
          color="teal-lighten-5"
          size="small"
          variant="tonal"
        >
          <VIcon class="mr-2">mdi-checkbox-outline</VIcon>
          Resolve All
        </VBtn>
      </template>
      <span>Mark all as resolved and hide discussion</span>
    </VTooltip>
  </div>
</template>
