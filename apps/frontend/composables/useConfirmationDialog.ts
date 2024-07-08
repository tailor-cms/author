interface ConfirmationDialogOptions {
  title: string;
  message: string;
  action: () => any;
}

export const useConfirmationDialog = () => {
  const { $eventBus } = useNuxtApp() as any;
  return (opts: ConfirmationDialogOptions) => {
    $eventBus.channel('app').emit('showConfirmationModal', opts);
  };
};
