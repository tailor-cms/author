<template>
  <TailorDialog
    v-model="isVisible"
    header-icon="mdi-alert"
    @click:outside="close"
  >
    <template #header>{{ context.title }}</template>
    <template #body>
      <div class="text-body-1 text-left">
        {{ context.message }}
      </div>
    </template>
    <template #actions>
      <VBtn color="primary-darken-4" variant="text" @click="close">Close</VBtn>
      <VBtn
        :focus="isVisible"
        class="px-3"
        color="primary-darken-2"
        variant="tonal"
        @click="confirm"
      >
        Confirm
      </VBtn>
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
  action: () => {},
});

const appChannel = $eventBus.channel('app');
const isVisible = ref(false);
const context = ref(createContext());

const open = (contextValue: any) => {
  context.value = contextValue;
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
