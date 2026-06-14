<template>
  <VSwitch
    v-model="isCoreSource"
    class="mb-4 ml-2"
    color="tertiary"
    density="comfortable"
    false-icon="mdi-star-outline"
    label="Core Source"
    true-icon="mdi-star"
    hide-details
  />
  <VTextarea
    v-model="description"
    class="mb-5"
    label="Description"
    variant="outlined"
    hide-details
  />
  <VCombobox
    v-model="tags"
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
