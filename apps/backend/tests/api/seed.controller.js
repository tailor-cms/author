import SeedService from './seed.service.js';

async function resetDatabase(_req, res) {
  await SeedService.resetDatabase();
  return res.status(200).send();
}

async function seedUser(_req, res) {
  const user = await SeedService.createUser();
  return res.json({ data: user });
}

async function seedCatalog(_req, res) {
  const repositories = await SeedService.seedCatalog();
  return res.json({ data: repositories });
}

async function seedRepository(_req, res) {
  const data = await SeedService.importRepositoryArchive();
  return res.json({ data });
}

export default {
  resetDatabase,
  seedUser,
  seedCatalog,
  seedRepository,
};
