<template>
  <TailorDialog v-model="isVisible" @click:outside="close" header-icon="mdi-alert">
    <template #header>{{ context.title }}</template>
    <template #body>
      <div class="text-body-1 text-left">
        {{ context.message }}
      </div>
    </template>
    <template #actions>
      <VBtn @click="close" variant="text">Close</VBtn>
      <VBtn v-focus="isVisible" @click="confirm" color="secondary" variant="text">
        Confirm
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import invoke from 'lodash/invoke';
import TailorDialog from '@/components/common/TailorDialog.vue';

const { $eventBus } = useNuxtApp() as any;

const createContext = () => ({
  title: '',
  message: '',
  action: () => {},
});

const appChannel = $eventBus.channel('app');
const isVisible = ref(false);
const context = ref(createContext());

const open = (contextValue) => {
  context.value = contextValue;
  isVisible.value = true;
  invoke(context.value, 'onOpen');
};

const close = () => {
  invoke(context.value, 'onClose');
  isVisible.value = false;
  context.value = createContext();
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
