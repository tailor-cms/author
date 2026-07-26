import { useClipboard } from '@vueuse/core';
import { upperFirst } from 'lodash-es';

/**
 * Copies text to the clipboard and surfaces a success / failure snackbar.
 * The label names what was copied (e.g. `ID`, `link`) and is woven into
 * both messages.
 */
export function useCopyToClipboard() {
  const notify = useNotification();
  const { copy } = useClipboard({ legacy: true });
  return async (text: string, label: string) => {
    try {
      await copy(text);
      notify(upperFirst(`${label} copied to the clipboard`));
    } catch {
      notify(`Not able to copy the ${label}`);
    }
  };
}
