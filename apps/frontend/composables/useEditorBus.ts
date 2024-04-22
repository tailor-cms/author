export const useEditorBus = () => {
  const { $eventBus } = useNuxtApp() as any;
  return $eventBus.channel('editor');
};
