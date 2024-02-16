interface NotificationOptions {
  color?: string;
  timeout?: number;
  immediate?: boolean;
}
export const useNotification = () => {
  const { $eventBus } = useNuxtApp() as any;
  return (message: string, opts?: NotificationOptions) => {
    opts = opts || {};
    $eventBus.channel('app').emit('showNotificationSnackbar', {
      message,
      ...opts,
    });
  };
};
