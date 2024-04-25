interface NotificationOptions {
  color?: string;
  timeout?: number;
  immediate?: boolean;
}
export const useNotification = () => {
  const { $eventBus } = useNuxtApp() as any;
  return (message: string, opts: NotificationOptions = {}) => {
    if (!opts.color) opts.color = 'primary-darken-3';
    $eventBus.channel('app').emit('showNotificationSnackbar', {
      message,
      ...opts,
    });
  };
};
