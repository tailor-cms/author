import assetApi from '@/api/repositoryAsset';

export const UploadStatus = {
  Uploading: 'uploading',
  Done: 'done',
  Error: 'error',
} as const;

export type UploadStatus = (typeof UploadStatus)[keyof typeof UploadStatus];

export interface UploadItem {
  id: string;
  repositoryId: number;
  name: string;
  size: number;
  progress: number; // 0..100
  status: UploadStatus;
  error?: string;
}

// Background upload manager. The store owns the in-flight
// requests, so uploads keep running and stay visible in the global indicator
// even after the user navigates away from the asset library.
export const useUploadStore = defineStore('uploads', () => {
  const items = reactive<UploadItem[]>([]);
  let counter = 0;

  function add(file: File, repositoryId: number): UploadItem {
    const item = reactive<UploadItem>({
      id: `${Date.now()}-${counter++}`,
      repositoryId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: UploadStatus.Uploading,
    });
    items.push(item);
    return item;
  }

  // Uploads each file in its own request so progress is tracked per file and a
  // single failure does not abort the rest. Resolves once all are settled.
  // `folder` (optional) is the virtual folder the batch lands in.
  function start(files: File[], repositoryId: number, folder?: string) {
    return Promise.all(
      files.map(async (file) => {
        const item = add(file, repositoryId);
        try {
          await assetApi.upload(repositoryId, [file], {
            folder,
            onProgress: (progress: number) => {
              item.progress = progress;
            },
          });
          item.progress = 100;
          item.status = UploadStatus.Done;
        } catch (err: any) {
          item.status = UploadStatus.Error;
          item.error = err?.response?.data?.error?.message ?? 'Upload failed';
        }
      }),
    );
  }

  // Uploads die with the page, so warn before a hard refresh / tab close while
  // any are still in flight.
  const activeCount = computed(
    () => items.filter((it) => it.status === UploadStatus.Uploading).length,
  );

  const hasCompleted = computed(
    () => items.some((it) => it.status !== UploadStatus.Uploading),
  );

  // Number of successfully uploaded assets for a repository.
  const completedUploadsFor = (repositoryId?: number) =>
    items.filter(
      (it) => it.repositoryId === repositoryId && it.status === UploadStatus.Done,
    ).length;

  function warnBeforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault();
  }

  watch(activeCount, (count) => {
    const method = count > 0 ? 'addEventListener' : 'removeEventListener';
    window[method]('beforeunload', warnBeforeUnload);
  });

  function dismiss(id: string) {
    const index = items.findIndex((it) => it.id === id);
    if (index !== -1) items.splice(index, 1);
  }

  function clearCompleted() {
    const active = items.filter((it) => it.status === UploadStatus.Uploading);
    items.splice(0, items.length, ...active);
  }

  return {
    items,
    activeCount,
    hasCompleted,
    start,
    dismiss,
    clearCompleted,
    completedUploadsFor,
  };
});
