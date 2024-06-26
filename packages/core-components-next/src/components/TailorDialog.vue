<template>
  <VDialog
    :width="props.width"
    v-bind="$attrs"
    @update:model-value="onModelUpdate"
  >
    <template v-if="$slots.activator" #activator="activatorProps">
      <slot v-bind="activatorProps" name="activator"></slot>
    </template>
    <template v-if="$slots.default" #default="defaultProps">
      <slot v-bind="defaultProps"></slot>
    </template>
    <VCard :data-testid="dataTestid" color="primary-lighten-5">
      <VCardTitle class="dialog-title pa-5 align-center bg-primary-darken-3">
        <VIcon class="pa-5 mr-1" color="teal-lighten-4" size="26">
          {{ props.headerIcon }}
        </VIcon>
        <div class="text-truncate text-primary-lighten-4">
          <slot name="header"></slot>
        </div>
      </VCardTitle>
      <VCardText :class="[props.paddingless ? 'pa-0' : 'pt-7 px-4 pb-2']">
        <slot name="body"></slot>
      </VCardText>
      <VCardActions v-if="$slots.actions" class="px-4 pb-3">
        <VSpacer />
        <slot name="actions"></slot>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
export interface Props {
  headerIcon?: string;
  width?: number | string;
  paddingless?: boolean;
  dataTestid?: string;
}

const props = withDefaults(defineProps<Props>(), {
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
