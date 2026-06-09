<template>
  <VSwitch
    v-model="isCoreSource"
    class="mb-4 ml-2"
    color="tertiary"
    false-icon="mdi-star-outline"
    label="Core Source"
    true-icon="mdi-star"
    hide-details
  />
  <VTextarea
    v-model="description"
    label="Description"
    variant="outlined"
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
