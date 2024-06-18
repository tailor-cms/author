import pMinDelay from 'p-min-delay';
import { ref } from 'vue';

export const useLoader = () => {
  const loading = ref(false);
  const loader = (action: (...args: any[]) => any, minDuration = 0) => {
    return function (...args: any[]) {
      loading.value = true;
      return pMinDelay(Promise.resolve(action(...args)), minDuration).finally(
        () => (loading.value = false),
      );
    };
  };
  return { loader, loading };
};
