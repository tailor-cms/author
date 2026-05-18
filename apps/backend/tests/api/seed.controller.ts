import type { Request, Response } from 'express';
import SeedService from './seed.service.ts';

// Express's `Request<Params, ResBody, ReqBody, ...>` puts the body at slot
// #3; this alias hides the leading positional placeholders so handlers can
// just write `Req<Body>`.
type Req<Body> = Request<unknown, unknown, Body>;

async function resetDatabase(_req: Request, res: Response) {
  await SeedService.resetDatabase();
  return res.status(200).send();
}

interface SeedUserBody {
  email?: string;
  password?: string;
  role?: string;
  userGroup?: { name?: string; role?: string };
}

async function seedUser(req: Req<SeedUserBody>, res: Response) {
  const { email, password, role, userGroup } = req.body;
  const user = await SeedService.createUser(email, password, role, userGroup);
  return res.json({ data: user });
}

interface SeedCatalogBody {
  userGroup?: { name?: string; role?: string };
}

async function seedCatalog(req: Req<SeedCatalogBody>, res: Response) {
  const { userGroup } = req.body;
  const repositories = await SeedService.seedCatalog({ userGroup });
  return res.json({ data: repositories });
}

interface SeedCommentBody {
  content: string;
  repositoryId: number;
  activityId: number;
  contentElementId?: number | null;
}

async function seedComment(req: Req<SeedCommentBody>, res: Response) {
  const { content, repositoryId, activityId, contentElementId } = req.body;
  const comment = await SeedService.createComment(
    content,
    repositoryId,
    activityId,
    contentElementId ?? null,
  );
  return res.json({ data: comment });
}

interface SeedRepositoryBody {
  name?: string;
  description?: string;
  authorEmail?: string | null;
  includeLinkExample?: boolean;
}

async function seedRepository(req: Req<SeedRepositoryBody>, res: Response) {
  const { name, description, authorEmail, includeLinkExample } = req.body;
  const data = await SeedService.importRepositoryArchive(
    name,
    description,
    authorEmail,
    { includeLinkExample },
  );
  return res.json({ data });
}

export default {
  resetDatabase,
  seedUser,
  seedCatalog,
  seedComment,
  seedRepository,
};
