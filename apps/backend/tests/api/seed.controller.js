import SeedService from './seed.service.js';

async function resetDatabase(_req, res) {
  await SeedService.resetDatabase();
  return res.status(200).send();
}

async function seedUser(req, res) {
  const { email, password, role, userGroup } = req.body;
  const user = await SeedService.createUser(email, password, role, userGroup);
  return res.json({ data: user });
}

async function seedCatalog(req, res) {
  const { userGroup } = req.body;
  const repositories = await SeedService.seedCatalog({ userGroup });
  return res.json({ data: repositories });
}

async function seedRepository(req, res) {
  const data = await SeedService.importRepositoryArchive(
    req.body.name,
    req.body.description,
  );
  return res.json({ data });
}

export default {
  resetDatabase,
  seedUser,
  seedCatalog,
  seedRepository,
};
