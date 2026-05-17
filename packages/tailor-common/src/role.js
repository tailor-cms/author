// Roles moved to @tailor-cms/interfaces/role. This module is preserved
// as a thin re-export for backward compatibility; new code should import
// from @tailor-cms/interfaces/role directly so TS types come along.
import role from '@tailor-cms/interfaces/role';

export {
  RepositoryRole,
  UserRole,
  repository,
  user,
} from '@tailor-cms/interfaces/role';

export default role;
