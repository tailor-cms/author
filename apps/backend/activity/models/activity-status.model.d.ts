import type {
  BelongsToGetAssociationMixin,
  Model,
  ModelStatic,
} from 'sequelize';
import type { Status as StatusAttrs } from '@tailor-cms/interfaces/activity';
import type { Activity } from './activity.model.js';

// Sequelize instance type for an ActivityStatus row. Composes the
// canonical attributes (from @tailor-cms/interfaces) with the Sequelize
// Model API + the `belongsTo(Activity)` getter mixin.
export type ActivityStatus = StatusAttrs &
  Model<StatusAttrs> & {
    getActivity: BelongsToGetAssociationMixin<Activity>;
  };

interface ActivityStatusModel extends ModelStatic<ActivityStatus> {
  // Sequelize Events constants (re-exported from `@tailor-cms/common/src/sse`).
  Events: {
    Update: string;
  };
}

declare const ActivityStatus: ActivityStatusModel;
export default ActivityStatus;
