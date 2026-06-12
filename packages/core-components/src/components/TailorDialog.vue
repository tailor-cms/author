<template>
  <VDialog :width="width" v-bind="$attrs" @update:model-value="onModelUpdate">
    <template v-if="$slots.activator" #activator="activatorProps">
      <slot v-bind="activatorProps" name="activator"></slot>
    </template>
    <template #default="defaultProps">
      <slot v-if="$slots.default" v-bind="defaultProps"></slot>
      <VCard :data-testid="dataTestid" rounded="xl">
        <VCardTitle class="dialog-title px-5 py-4 align-center">
          <VIcon :icon="headerIcon" :color="color" class="mr-3" size="small" />
          <div class="text-truncate font-weight-semibold">
            <slot name="header"></slot>
          </div>
        </VCardTitle>
        <VCardText :class="[paddingless ? 'pa-0' : 'py-2 px-4']">
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
  color?: string;
}

withDefaults(defineProps<Props>(), {
  headerIcon: 'mdi-alert',
  color: 'primary',
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
