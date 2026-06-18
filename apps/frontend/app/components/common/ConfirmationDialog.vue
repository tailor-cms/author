<template>
  <TailorDialog
    v-model="isVisible"
    :color="context.color"
    :title="context.title"
    header-icon="mdi-alert"
    @click:outside="close"
  >
    <template #body>
      <div class="text-body-large text-left">
        {{ context.message }}
      </div>
    </template>
    <template #actions>
      <VBtn text="Close" variant="text" @click="close" />
      <VBtn
        :color="context.color"
        :focus="isVisible"
        class="px-3"
        text="Confirm"
        variant="flat"
        @click="confirm"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { invoke } from 'lodash-es';
import { TailorDialog } from '@tailor-cms/core-components';

const { $eventBus } = useNuxtApp() as any;

const createContext = () => ({
  title: '',
  message: '',
  color: 'primary',
  action: () => {},
});

const appChannel = $eventBus.channel('app');
const isVisible = ref(false);
const context = ref(createContext());

const open = (contextValue: any) => {
  context.value = { ...createContext(), ...contextValue };
  isVisible.value = true;
  invoke(context.value, 'onOpen');
};

const close = () => {
  isVisible.value = false;
  invoke(context.value, 'onClose');
  // Wait for transition to end before resetting context
  setTimeout(() => {
    context.value = createContext();
  }, 200);
};

const confirm = () => {
  context.value?.action();
  close();
};

onMounted(() => {
  appChannel.on('showConfirmationModal', open);
});

onBeforeUnmount(() => {
  appChannel.off('showConfirmationModal', open);
});
</script>
