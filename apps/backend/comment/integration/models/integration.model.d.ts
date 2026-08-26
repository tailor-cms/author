import type { Model, ModelStatic } from 'sequelize';
import type { IntegrationType } from '@tailor-cms/interfaces/comment';

export interface IntegrationAttrs {
  id: number;
  repositoryId: number;
  key: string;
  name: string;
  icon: string | null;
  type: IntegrationType;
  // inbound webhook tokens are matched against this digest.
  tokenHash: string | null;
  isEnabled: boolean;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

export type Integration = IntegrationAttrs & Model<IntegrationAttrs>;

declare const Integration: ModelStatic<Integration>;
export default Integration;
