import { inject } from 'vue';

interface ConfirmationDialogOptions {
  title: string;
  message: string;
  action: () => any;
}

export const useConfirmationDialog = () => {
  const eventBus = inject<any>('$eventBus');
  return (opts: ConfirmationDialogOptions) => {
    eventBus.channel('app').emit('showConfirmationModal', opts);
  };
};
