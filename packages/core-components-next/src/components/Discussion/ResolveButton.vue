<template>
  <div class="resolve-btn-container">
    <VTooltip location="left" open-delay="800">
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="{ ...$attrs, ...tooltipProps }"
          class="px-1"
          color="teal-accent-4"
          size="small"
          variant="text"
        >
          <VIcon class="mr-2" color="teal-accent-4" size="24">
            mdi-checkbox-outline
          </VIcon>
          Resolve All
        </VBtn>
      </template>
      <span>Mark all as resolved and hide discussion</span>
    </VTooltip>
  </div>
</template>
