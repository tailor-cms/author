<template>
  <div class="d-flex align-center justify-space-between mb-4 px-1">
    <div class="d-flex align-center ga-2">
      <VIcon
        :color="isCoreSource ? 'tertiary' : ''"
        :icon="isCoreSource ? 'mdi-star' : 'mdi-star-outline'"
        size="20"
      />
      <span
        :class="{ 'text-tertiary font-weight-medium': isCoreSource }"
        class="text-body-medium"
      >
        Core Source
      </span>
    </div>
    <VSwitch v-model="isCoreSource" hide-details />
  </div>
  <div class="section-header text-body-small text-uppercase mb-4">
    Edit Details
  </div>
  <VTextarea
    v-model="description"
    label="Description"
    variant="outlined"
    rows="3"
    hide-details
  />
  <VCombobox
    v-model="tags"
    class="mt-3"
    label="Tags"
    variant="outlined"
    closable-chips
    chips
    hide-details
    multiple
  />
</template>

<script lang="ts" setup>
const isCoreSource = defineModel<boolean>('isCoreSource', { required: true });
const description = defineModel<string>('description', { required: true });
const tags = defineModel<string[]>('tags', { required: true });
</script>

<style lang="scss" scoped>
.section-header {
  letter-spacing: 0.08em;
}
</style>
