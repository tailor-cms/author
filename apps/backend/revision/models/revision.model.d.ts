import type { FindOptions, Model, ModelStatic } from 'sequelize';
import type { Revision as RevisionAttrs } from '@tailor-cms/interfaces/revision';

// Sequelize instance type for a Revision entity.
export type Revision = RevisionAttrs &
  Model<RevisionAttrs> & {
    // Runs the content-element fetch hooks against this revision's
    // `state` (`CONTENT_ELEMENT` rows only - no-op otherwise).
    applyFetchHooks(): Promise<Revision>;
  };

interface RevisionModel extends ModelStatic<Revision> {
  // Returns one revision when called with a numeric id, otherwise a list
  // (via `findAll(query)`).
  fetch(id: number, options?: FindOptions<RevisionAttrs>): Promise<Revision>;
  fetch(query: FindOptions<RevisionAttrs>): Promise<Revision[]>;
}

declare const Revision: RevisionModel;
export default Revision;
