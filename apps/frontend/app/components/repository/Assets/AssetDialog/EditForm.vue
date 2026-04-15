<template>
  <div class="d-flex align-center justify-space-between mb-4 px-1">
    <div class="d-flex align-center ga-2">
      <VIcon
        :color="isCoreSource ? 'amber-lighten-1' : 'primary-lighten-2'"
        :icon="isCoreSource ? 'mdi-star' : 'mdi-star-outline'"
        size="20"
      />
      <span
        :class="{ 'text-amber-lighten-1 font-weight-medium': isCoreSource }"
        class="text-body-2 text-primary-lighten-3"
      >
        Core Source
      </span>
    </div>
    <VSwitch
      v-model="isCoreSource"
      color="amber-lighten-1"
      density="compact"
      hide-details
      inset
    />
  </div>
  <div class="section-header text-caption text-uppercase text-primary-lighten-2 mb-4">
    Edit Details
  </div>
  <VTextarea
    v-model="description"
    color="primary-lighten-3"
    density="comfortable"
    label="Description"
    variant="outlined"
    rows="3"
    hide-details
  />
  <VCombobox
    v-model="tags"
    class="mt-3"
    color="primary-lighten-3"
    density="comfortable"
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
