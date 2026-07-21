import pMinDelay from 'p-min-delay';
import { inject, ref } from 'vue';

import { useConfirmationDialog } from './useConfirmationDialog';

type Emit = (event: 'upload' | 'delete', ...args: any[]) => void;

// Floor the visible upload time so the progress panel doesn't flash on fast
// (small-file / localhost) uploads.
const MIN_LOADING_MS = 800;

const download = (url: string, fileName: string) => {
  const anchor = document.createElement('a');
  Object.assign(anchor, { href: url, download: fileName, target: '_blank' });
  anchor.click();
};

export const useUpload = (emit: Emit) => {
  const uploading = ref(false);
  // Percent complete, or null when no progress has been reported yet (or the
  // upload reports none at all); null renders as an indeterminate bar.
  const progress = ref<number | null>(null);
  const error = ref('');

  const storageService = inject<any>('$storageService');
  const showConfirmationDialog = useConfirmationDialog();

  const deleteFile = (item: any) => {
    showConfirmationDialog({
      title: 'Delete file?',
      message: `Are you sure you want to remove ${item.fileName}?`,
      action: () => emit('delete'),
    });
  };

  /**
   * Uploads the file and emits the `upload` event on success.
   * Resolves with the uploaded asset payload, or null on failure
   */
  const upload = async (file: File) => {
    if (!file) return null;
    uploading.value = true;
    progress.value = null;
    error.value = '';
    const form = new FormData();
    form.append('file', file, file.name);
    try {
      const uploadRequest: Promise<any> = storageService.upload(form, {
        onProgress: (percent: number) => { progress.value = percent; },
      });
      const data = await pMinDelay(uploadRequest, MIN_LOADING_MS);
      const payload = {
        key: data.key,
        name: file.name,
        url: data.url,
        publicUrl: data.publicUrl,
      };
      emit('upload', payload);
      return payload;
    } catch {
      error.value = 'Upload failed. Please try again.';
      return null;
    } finally {
      uploading.value = false;
    }
  };

  const downloadFile = async (key: string, name: string) => {
    const url = await storageService.getUrl(key);
    return download(url, name);
  };

  return {
    upload,
    downloadFile,
    deleteFile,
    uploading,
    progress,
    error,
  };
};
