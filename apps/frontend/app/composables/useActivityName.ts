/** Resolves a name through the `data:value` plugin filter (e.g. i18n). */
export const useActivityName = () => {
  const { $pluginRegistry } = useNuxtApp() as any;

  const getActivityName = (
    activity?: { data?: Record<string, any> } | null,
  ): string => {
    const data = activity?.data;
    if (!data) return '';
    const rawValue = data.name ?? '';
    const resolved = $pluginRegistry.filter('data:value', rawValue, {
      data,
      key: 'name',
    });
    return resolved ?? rawValue;
  };

  return { getActivityName };
};
