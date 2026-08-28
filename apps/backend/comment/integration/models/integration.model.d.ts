import type { Model, ModelStatic, Optional } from 'sequelize';
import type { IntegrationType } from '@tailor-cms/interfaces/comment';

export interface IntegrationAttrs {
  id: number;
  // Null for a built-in, which belongs to every repository.
  repositoryId: number | null;
  key: string;
  name: string;
  icon: string | null;
  type: IntegrationType;
  // Inbound webhook tokens are matched against this digest.
  tokenHash: string | null;
  isEnabled: boolean;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

// Default/generated
type GeneratedAttrs = 'id' | 'isEnabled' | 'createdAt' | 'updatedAt';

export type Integration = IntegrationAttrs &
  Model<IntegrationAttrs, Optional<IntegrationAttrs, GeneratedAttrs>>;

declare const Integration: ModelStatic<Integration>;
export default Integration;
