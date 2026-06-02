/**
 * The editor's "focus context"
 * the activity (and optional content element) the user is currently looking at
 * resolved into:
 *   - focusChip: { short, full } for the compact target chip in the input
 *     toolbar - `short` is the level label + id, `full` the breadcrumb shown
 *     in the tooltip. Null when nothing is selected.
 *   - focusPayload: structured FocusedTarget[] sent on every agent run,
 *     so the model can resolve "this" / "the topic" without an extra read
 */
import { Entity } from '@tailor-cms/interfaces/revision.ts';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

export function useAgentFocus() {
  const { $ceRegistry, $schemaService } = useNuxtApp() as any;
  const repositoryStore = useCurrentRepository();
  const editorStore = useEditorStore();

  const focusedActivity = computed<any>(
    () =>
      (editorStore as any).selectedActivity ||
      (repositoryStore as any).selectedActivity ||
      null,
  );

  const focusedElement = computed<any>(
    () => (editorStore as any).selectedContentElement || null,
  );

  // Human-readable element type label from the content-element registry
  const getElementLabel = (type: string): string =>
    $ceRegistry.get(type)?.name || type;

  const focusChip = computed(() => {
    const activity = focusedActivity.value;
    if (!activity) return null;
    const activityName =
      activity.data?.name || activity.data?.title || '(untitled)';
    const levelConfig = $schemaService?.getLevel?.(activity.type);
    const activityLabel =
      levelConfig?.label ||
      String(activity.type || '')
        .split('/')
        .pop();
    const element = focusedElement.value;
    const elementSuffix = element
      ? ` › ${getElementLabel(element.type)} #${element.id}`
      : '';
    const short = `${activityLabel} #${activity.id}${elementSuffix}`;
    const full = `${activityName}${elementSuffix}`;
    return { short, full };
  });

  const focusPayload = computed(() => {
    const targets: any[] = [];
    const activity = focusedActivity.value;
    if (activity) {
      targets.push({
        kind: Entity.Activity,
        id: activity.id,
        type: activity.type,
        label: activity.data?.name || activity.data?.title || '',
      });
    }
    const element = focusedElement.value;
    if (element && typeof element.id === 'number') {
      targets.push({
        kind: Entity.ContentElement,
        id: element.id,
        type: element.type,
        label: getElementLabel(element.type),
      });
    }
    return targets.length ? targets : undefined;
  });

  return { focusChip, focusPayload };
}
