// Custom field attached to Sequelize write options that threads metadata
// from controllers through model methods into lifecycle hooks. Carried
// on `create`, `update`, `destroy`, and the platform's static helpers
// (`createByUser`, etc.). All fields are optional - hooks defensively
// read whatever they care about and ignore the rest.
//
// Used uniformly across Repository, Activity, and ContentElement writes;
// not tied to any single model.
export interface OperationContext {
  // Acting user id - read by audit/unpublished-changes hooks to attribute
  // the mutation. Absent for system-initiated writes (linked-content sync,
  // imports running before user resolution, etc.).
  userId?: number;
  // Set true by linked-content propagation flows. Content-element and
  // activity hooks short-circuit recursive sync when they see this, so
  // a single source edit doesn't loop through every linked copy.
  linkSync?: boolean;
  // Parent Repository instance attached internally by activity and
  // content-element hooks so the next propagation step can bump
  // `hasUnpublishedChanges`. Opaque to callers.
  repository?: unknown;
  // Shared id stamped on every revision produced by one logical operation
  // (e.g. a restore cascade) so the UI can group them. Null/absent for
  // standalone edits.
  transactionId?: string;
}
