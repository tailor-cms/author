<template>
  <VSnackbar
    v-model="isVisible"
    :color="context.color"
    :timeout="context.timeout"
    class="ma-8 text-subtitle-2"
    location="bottom right"
    multi-line
  >
    {{ context.message }}
    <template #actions>
      <VBtn
        color="primary-lighten-3"
        icon="mdi-close"
        variant="tonal"
        @click="close"
      />
    </template>
  </VSnackbar>
</template>

<script lang="ts" setup>
import debounce from 'lodash/debounce';
import Queue from 'promise-queue';

interface NotificationOptions {
  message: string;
  color?: string;
  timeout?: number;
  immediate?: boolean;
}

const { $eventBus } = useNuxtApp() as any;
const queue = new Queue(1, Infinity);

const initialData = (): NotificationOptions => ({
  message: '',
  color: 'primary-darken-4',
  timeout: 2500,
  immediate: false,
});

const isVisible = ref(false);
const context = ref(initialData());

const show = (options: NotificationOptions) => {
  context.value = options;
  isVisible.value = true;
};

const close = () => {
  isVisible.value = false;
};

const addToQueue = (opts: NotificationOptions) => queue.add(() => show(opts));
const schedule = (opts: NotificationOptions) => {
  return (opts.immediate ? addToQueue : debounce(addToQueue, 2500))(opts);
};

watch(isVisible, (visible) => {
  if (visible) return;
  context.value = initialData();
});

onMounted(() => {
  const appChannel = $eventBus.channel('app');
  appChannel.on('showNotificationSnackbar', (opts: NotificationOptions) => {
    schedule(opts);
  });
});
</script>
