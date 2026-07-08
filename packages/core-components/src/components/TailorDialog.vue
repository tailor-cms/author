<template>
  <VDialog :width="width" v-bind="$attrs" @update:model-value="onModelUpdate">
    <template v-if="$slots.activator" #activator="activatorProps">
      <slot v-bind="activatorProps" name="activator"></slot>
    </template>
    <template #default="defaultProps">
      <slot v-if="$slots.default" v-bind="defaultProps"></slot>
      <DefineCard>
        <VCard
          :data-testid="dataTestid"
          color="surface-raised"
          rounded="xl"
          elevation="5"
        >
          <VCardItem class="px-5 py-4">
            <template #prepend>
              <VIcon :icon="headerIcon" :color="color" />
            </template>
            <VCardTitle class="dialog-title">{{ title }}</VCardTitle>
          </VCardItem>
          <div v-if="$slots.subheader" class="dialog-subheader">
            <slot name="subheader"></slot>
          </div>
          <VCardText class="py-2 px-4">
            <slot name="body"></slot>
          </VCardText>
          <VCardActions v-if="$slots.actions" class="px-4 pb-3">
            <VDefaultsProvider :defaults="{ VBtn: { slim: false } }">
              <slot name="actions"></slot>
            </VDefaultsProvider>
          </VCardActions>
        </VCard>
      </DefineCard>
      <form v-if="isForm" novalidate @submit.prevent="emit('submit', $event)">
        <ReuseCard />
      </form>
      <ReuseCard v-else />
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance } from 'vue';
import { createReusableTemplate } from '@vueuse/core';

const [DefineCard, ReuseCard] = createReusableTemplate();

export interface Props {
  title?: string;
  headerIcon?: string;
  width?: number | string;
  dataTestid?: string;
  color?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
  headerIcon: 'mdi-alert',
  color: 'primary',
  width: 500,
  dataTestid: 'tailorDialog',
});

const emit = defineEmits(['open', 'close', 'submit']);

const instance = getCurrentInstance();
const isForm = computed(() => !!instance?.vnode.props?.onSubmit);

const onModelUpdate = (val: boolean) => {
  emit(val ? 'open' : 'close');
};
</script>

<style lang="scss" scoped>
.dialog-title {
  font-weight: 600;
}
</style>
