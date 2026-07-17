<template>
  <VSnackbarQueue
    v-model="messages"
    :total-visible="MAX_VISIBLE"
    :gap="12"
    content-class="ma-4"
    location="bottom right"
  >
    <template #actions="{ props: actionProps }">
      <VBtn
        v-bind="actionProps"
        icon="mdi-close"
        density="comfortable"
      />
    </template>
  </VSnackbarQueue>
</template>

<script lang="ts" setup>
interface NotificationOptions {
  message: string;
  color?: string;
  timeout?: number;
}

interface QueuedNotification {
  text: string;
  color?: string;
  timeout: number;
}

const DEFAULT_TIMEOUT = 2500;
const MAX_VISIBLE = 4;

const { $eventBus } = useNuxtApp() as any;
// VSnackbarQueue owns the queue: pushing drives display, it shifts items off.
const messages = ref<any[]>([]);

const enqueue = (opts: NotificationOptions) => {
  const message: QueuedNotification = {
    text: opts.message,
    color: opts.color,
    timeout: opts.timeout ?? DEFAULT_TIMEOUT,
  };
  messages.value.push(message);
};

onMounted(() => {
  $eventBus.channel('app').on('showNotificationSnackbar', enqueue);
});
</script>
