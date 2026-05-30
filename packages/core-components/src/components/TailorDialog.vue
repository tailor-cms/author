<template>
  <VDialog :width="width" v-bind="$attrs" @update:model-value="onModelUpdate">
    <template v-if="$slots.activator" #activator="activatorProps">
      <slot v-bind="activatorProps" name="activator"></slot>
    </template>
    <template #default="defaultProps">
      <slot v-if="$slots.default" v-bind="defaultProps"></slot>
      <VCard :data-testid="dataTestid">
        <VCardTitle class="dialog-title pa-5 align-center bg-surface-container">
          <VIcon :icon="headerIcon" color="secondary" class="pa-5 mr-1" size="32" />
          <div class="text-truncate">
            <slot name="header"></slot>
          </div>
        </VCardTitle>
        <VCardText :class="[paddingless ? 'pa-0' : 'pt-7 px-4 pb-2']">
          <slot name="body"></slot>
        </VCardText>
        <VCardActions v-if="$slots.actions" class="px-4 pb-3">
          <VSpacer />
          <slot name="actions"></slot>
        </VCardActions>
      </VCard>
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
export interface Props {
  headerIcon?: string;
  width?: number | string;
  paddingless?: boolean;
  dataTestid?: string;
}

withDefaults(defineProps<Props>(), {
  headerIcon: 'mdi-alert',
  width: 500,
  paddingless: false,
  dataTestid: 'tailorDialog',
});

const emit = defineEmits(['open', 'close']);

const onModelUpdate = (val: boolean) => {
  emit(val ? 'open' : 'close');
};
</script>

<style lang="scss" scoped>
.dialog-title {
  display: flex;

  .text-truncate {
    flex: 1;
    text-align: left;
  }
}
</style>
