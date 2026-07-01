// Referential integrity for collection records. When a record is deleted, this
// resolves what happens to the records that still link to it, per each
// relationship's `onDelete` policy: RESTRICT blocks the delete, SET_NULL drops
// the dangling ref, CASCADE deletes the linking record too. Driven from the
// Activity service's `remove`.
import type { Activity } from './models/activity.model.js';
import type { ActivityRelationship } from '@tailor-cms/interfaces/schema';
import type { Repository } from '../repository/models/repository.model.js';
import { Op } from 'sequelize';
import { ReferenceDeletePolicy } from '@tailor-cms/interfaces/schema';
import { schema } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import groupBy from 'lodash/groupBy.js';

const { Activity: ActivityModel } = db;
const { getReferencingRelationships } = schema;
const { Restrict, SetNull, Cascade } = ReferenceDeletePolicy;

export type OpContext = { userId: number; repository: Repository };

// Thrown when a record can't be deleted because another record links to it
// through a RESTRICT relationship. Mapped to 409 in the delete action.
export class RestrictedDeletionError extends Error {
  blockers: Array<{
    id: number;
    name?: string;
    type: string;
    relationship: string;
  }>;

  constructor(blockers: RestrictedDeletionError['blockers']) {
    const names = [...new Set(blockers.map((it) => it.name).filter(Boolean))];
    const detail = names.length ? ` (${names.join(', ')})` : '';
    super(`Can't delete - other records still link to it${detail}.`);
    this.name = 'RestrictedDeletionError';
    this.blockers = blockers;
  }
}

// Describes one record's reference to the record being deleted
interface ReferenceDescriptor {
  // The record being deleted (the target of the reference).
  targetId: number;
  // The record that holds the reference.
  source: Activity;
  // The relationship config.
  relationship: ActivityRelationship;
}

interface DeletionImpact {
  // RESTRICT: references that block the delete.
  blockers: RestrictedDeletionError['blockers'];
  // SET_NULL: references whose dangling ref is dropped from the source.
  unlinks: ReferenceDescriptor[];
  // CASCADE: source records deleted along with the target.
  cascades: Activity[];
}

// Effective delete policy for a relationship
const resolvePolicy = (rel: ActivityRelationship): ReferenceDeletePolicy =>
  rel.onDelete ?? (rel.allowEmpty === false ? Restrict : SetNull);

// True when a refs entry (number, `{ id }`, or array of either) points at `id`.
const refersTo = (value: any, id: number): boolean =>
  (Array.isArray(value) ? value : [value]).some((it) =>
    it && typeof it === 'object' ? it.id === id : it === id,
  );

// Records that reference `target`, each paired with its relationship and
// resolved policy. Scoped at the DB to the entity types that can reference this
// target (from the schema);
async function findReferencesTo(target: Activity): Promise<ReferenceDescriptor[]> {
  const referencing = getReferencingRelationships(target.type);
  if (!referencing.length) return [];
  const sourceTypes = [...new Set(referencing.map((it) => it.sourceType))];
  const candidates = (await ActivityModel.findAll({
    where: { repositoryId: target.repositoryId, type: { [Op.in]: sourceTypes } },
  })) as Activity[];
  return referencing.flatMap(({ sourceType, relationship }) =>
    candidates
      .filter(
        (source) =>
          source.type === sourceType &&
          refersTo((source.refs as any)?.[relationship.type], target.id),
      )
      .map((source) => ({
        source,
        relationship,
        targetId: target.id,
      })),
  );
}

// Classifies everything that links to `target` by delete policy, recursing
// through CASCADE chains so the full closure is resolved before anything is
// touched. RESTRICT edges become blockers, SET_NULL edges become unlinks,
// CASCADE edges queue the source for deletion and recurse; `visited` guards
// cycles.
//
// Example: deleting Category "News". An Article references it via `category`
// (CASCADE), so the Article is queued and we recurse; now classifying whatever
// links to that Article. If a Comment has a required `article` ref (RESTRICT),
// it surfaces as a blocker and stops the whole delete, even though it points at
// the Article, not at "News" directly.
async function collectDeletionImpact(
  target: Activity,
  acc: DeletionImpact,
  visited: Set<number>,
): Promise<DeletionImpact> {
  for (const reference of await findReferencesTo(target)) {
    const { source, relationship } = reference;
    const policy = resolvePolicy(relationship);
    if (policy === Restrict) {
      acc.blockers.push({
        id: source.id,
        name: (source.data as any)?.name,
        type: source.type,
        relationship: relationship.label,
      });
    } else if (policy === SetNull) {
      acc.unlinks.push(reference);
    } else if (policy === Cascade && !visited.has(source.id)) {
      visited.add(source.id);
      acc.cascades.push(source);
      await collectDeletionImpact(source, acc, visited);
    }
  }
  return acc;
}

// SET_NULL: strip the now-dangling reference from every source that pointed at
// the deleted record. Grouped by source so each record is written once, even
// when it referenced the target through several relationships.
// Example - deleting Tag #42:
//   unlinks = [
//     { source: ArticleA, relationship: tags,        targetId: 42 },
//     { source: ArticleA, relationship: featuredTag, targetId: 42 },
//     { source: ArticleB, relationship: tags,        targetId: 42 },
//   ]
//        | groupBy source.id
//        v
//   { A: [tags, featuredTag], B: [tags] }  -> A saved once, B saved once
async function unlinkSources(unlinks: ReferenceDescriptor[], context: OpContext) {
  for (const group of Object.values(groupBy(unlinks, (it) => it.source.id))) {
    const [{ source }] = group;
    // Drop the deleted record's id from each relationship list it appeared in.
    for (const { relationship, targetId } of group) {
      source.removeReference(relationship.type, targetId);
    }
    // Persist the pruned refs once for this source.
    await source.update({ refs: source.refs }, { context } as any);
  }
}

// CASCADE: soft-delete each linking record (and its own subtree).
async function cascadeDelete(cascades: Activity[], context: OpContext) {
  for (const source of cascades) {
    await source.remove({ recursive: true, soft: true, context });
  }
}

// Resolves referential integrity before a collection record is deleted: blocks
// on RESTRICT, drops dangling refs on SET_NULL, and deletes dependents on
// CASCADE. No-op when nothing links to the record.
export async function applyReferentialDeletion(
  target: Activity,
  context: OpContext,
): Promise<void> {
  const impact = await collectDeletionImpact(
    target,
    { blockers: [], unlinks: [], cascades: [] },
    new Set([target.id]),
  );
  if (impact.blockers.length) throw new RestrictedDeletionError(impact.blockers);
  await unlinkSources(impact.unlinks, context);
  await cascadeDelete(impact.cascades, context);
}
