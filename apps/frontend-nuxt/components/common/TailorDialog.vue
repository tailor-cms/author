<template>
  <VDialog :width="props.width" v-bind="$attrs">
    <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope"/>
    </template>
    <VCard :data-testid="dataTestid">
      <VCardTitle class="dialog-title bg-primary-darken-3 pa-5">
        <VAvatar
          v-if="props.headerIcon"
          color="secondary"
          size="38"
          class="mr-3"
        >
          <VIcon size="26">{{ props.headerIcon }}</VIcon>
        </VAvatar>
        <div class="text-truncate">
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
  width: 500,
  paddingless: false,
  dataTestid: 'tailorDialog',
});
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
