import type { RequestHandler } from 'express';
import type { Repository } from './repository.model.js';

// Properties available on the Express Request after middleware injection.
// Intentionally not extending Express.Request to avoid type conflicts
// with built-in properties. Controllers destructure only
// the properties they need; the `handler` cast bridges the type gap
// for router registration.
export interface RepositoryRequest {
  // The acting user, attached by the auth middleware
  user: any;
  // Loaded by the getRepository param middleware on /:repositoryId routes
  repository?: Repository;
  body: any;
  query: any;
  params: any;
  // Multer-uploaded archive on the import endpoint
  file?: {
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  };
  // Pagination/sort options assembled by processQuery(); merged with
  // ad-hoc Sequelize query keys (`include`, `distinct`, ...) by handlers
  // before being passed to findAndCountAll(), so the shape is open.
  opts: {
    limit: number;
    offset: number;
    where: any;
    order?: any[];
    [key: string]: any;
  };
}

// Narrowed request type for /:repositoryId routes where getRepository
// guarantees the repository is loaded.
export type RepositoryItemRequest = RepositoryRequest & { repository: Repository };

// Bridges typed request handlers to Express's RequestHandler via type cast.
// Controllers use RepositoryRequest (with injected repository, user, etc.)
// but Express routers expect standard RequestHandler. The cast is safe
// because middleware (auth, getRepository, processQuery, multer) populates
// the required properties before the handler runs.
export const handler = <T extends RepositoryRequest>(
  fn: (req: T, res: any) => unknown,
) => fn as unknown as RequestHandler;
