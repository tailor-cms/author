export const useEditorBus = () => {
  const { $eventBus } = useNuxtApp();
  return $eventBus.channel('editor');
};
