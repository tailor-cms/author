import { inject, ref } from 'vue';

import { useConfirmationDialog } from './useConfirmationDialog';
import { useLoader } from './useLoader';

type Emit = (event: 'delete' | 'upload', ...args: any[]) => void;

const download = (url: string, fileName: string) => {
  const anchor = document.createElement('a');
  Object.assign(anchor, { href: url, download: fileName, target: '_blank' });
  anchor.click();
};

export const useUpload = (emit: Emit) => {
  const error = ref('');

  const { loading: uploading, loader } = useLoader();
  const storageService = inject<any>('$storageService');
  const showConfirmationDialog = useConfirmationDialog();

  const deleteFile = (item: any) => {
    showConfirmationDialog({
      title: 'Delete file?',
      message: `Are you sure you want to remove ${item.fileName}?`,
      action: () => emit('delete'),
    });
  };

  const upload = (file: File) => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file, file.name);

    return storageService
      .upload(form)
      .then((data: any) => {
        const { name, size } = form.get('file') as File;
        emit('upload', { ...data, name, size });
      })
      .catch(() => (error.value = 'An error has occurred!'));
  };

  const downloadFile = async (key: string, name: string) => {
    const url = await storageService.getUrl(key);
    return download(url, name);
  };

  return {
    upload: loader(upload),
    downloadFile,
    deleteFile,
    uploading,
    error,
  };
};
