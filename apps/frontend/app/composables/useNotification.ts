interface NotificationOptions {
  color?: string;
  timeout?: number;
}
export const useNotification = () => {
  const { $eventBus } = useNuxtApp() as any;
  return (message: string, opts: NotificationOptions = {}) => {
    $eventBus.channel('app').emit('showNotificationSnackbar', {
      message,
      ...opts,
    });
  };
};
