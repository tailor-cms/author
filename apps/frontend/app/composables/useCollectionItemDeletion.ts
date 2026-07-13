import type { StoreActivity } from '@/stores/activity';
import { ReferenceDeletePolicy } from '@tailor-cms/interfaces/schema';
import { useActivityStore } from '@/stores/activity';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';
import pluralize from 'pluralize-esm';

// A record that still references the item being deleted
interface ReferencingRecord {
  referrer: StoreActivity;
  policy: ReferenceDeletePolicy;
}

// True when `value` (a refs entry: number, `{ id }`, or array of either)
// references `targetId`.
const referencesTarget = (value: any, targetId: number): boolean => {
  if (!value) return false;
  const list = Array.isArray(value) ? value : [value];
  return list.some((it) =>
    it && typeof it === 'object' ? it.id === targetId : it === targetId,
  );
};

const resolvePolicy = (
  rel: { onDelete?: ReferenceDeletePolicy; allowEmpty?: boolean },
): ReferenceDeletePolicy =>
  rel.onDelete ??
  (rel.allowEmpty === false
    ? ReferenceDeletePolicy.Restrict
    : ReferenceDeletePolicy.SetNull);

/**
 * Deletion of a collection record, aware of the records that reference it.
 * Builds an impact preview from the schema's referencing relationships + the
 * loaded store, then confirms (or blocks, for required RESTRICT references)
 * before deleting. The backend enforces the same policy authoritatively.
 */
export function useCollectionItemDeletion() {
  const { $schemaService } = useNuxtApp() as any;
  const repositoryStore = useCurrentRepository();
  const activityStore = useActivityStore();
  const confirm = useConfirmationDialog();
  const notify = useNotification();

  const entityLabel = (type: string): string =>
    $schemaService.getLevel(type)?.label ?? 'records';

  // Records in the loaded store that reference `item`
  const findReferencingRecords = (item: StoreActivity): ReferencingRecord[] => {
    const referencing = $schemaService.getReferencingRelationships?.(item.type) ?? [];
    return referencing.flatMap(({ sourceType, relationship }: any) => {
      const policy = resolvePolicy(relationship);
      const isReferrer = (it: StoreActivity) =>
        it.type === sourceType &&
        !it.deletedAt &&
        referencesTarget((it.refs as any)?.[relationship.type], item.id);
      return repositoryStore.activities
        .filter(isReferrer)
        .map((referrer) => ({ referrer, policy }));
    });
  };

  const summarize = (records: ReferencingRecord[]): string => {
    const counts = records.reduce(
      (acc, { referrer }) => {
        acc[referrer.type] = (acc[referrer.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(counts)
      .map(([type, n]) => `${n} ${entityLabel(type)}`)
      .join(', ');
  };

  const requestDeletion = (item: StoreActivity, onDeleted?: () => void) => {
    const records = findReferencingRecords(item);
    const name = item.data?.name || 'this item';
    const blockers = records.filter(
      (it) => it.policy === ReferenceDeletePolicy.Restrict,
    );
    if (blockers.length) {
      confirm({
        title: `Can't delete "${name}"`,
        color: 'primary',
        message:
          `It's still referenced by ${summarize(blockers)} ` +
          `(required). Remove those references first.`,
        action: () => {},
      });
      return;
    }
    const cascades = records.filter(
      (it) => it.policy === ReferenceDeletePolicy.Cascade,
    );
    const unlinks = records.filter(
      (it) => it.policy === ReferenceDeletePolicy.SetNull,
    );
    const impact = [
      cascades.length && `${summarize(cascades)} will also be deleted`,
      unlinks.length && `${summarize(unlinks)} will be unlinked`,
    ].filter(Boolean);

    // Entity labels are plural (they name the collection list, e.g. "Tags")
    const label = pluralize.singular(
      $schemaService.getActivityLabel(item) ?? 'item',
    );
    const message = impact.length
      ? `Delete the ${label} "${name}"? ${impact.join('; ')}.`
      : `Are you sure you want to delete the ${label} "${name}"?`;
    confirm({
      title: `Delete ${label}?`,
      color: 'error',
      message,
      action: async () => {
        try {
          await activityStore.remove(item.id);
          notify(`The ${label} has been deleted`, { immediate: true });
          onDeleted?.();
        } catch {
          const failure =
            `We couldn't delete the ${label}. It may still be referenced.`;
          notify(failure, { color: 'error' });
        }
      },
    });
  };

  return { requestDeletion };
}
