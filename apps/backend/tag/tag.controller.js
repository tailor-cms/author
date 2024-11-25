import yn from 'yn';
import db from '../shared/database/index.js';

const { Tag } = db;

async function list({ user, query: { associated } }, res) {
  const tags = await (yn(associated) ? Tag.getAssociated(user) : Tag.findAll());
  return res.json({ data: tags });
}

export default {
  list,
};
