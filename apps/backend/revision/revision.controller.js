import map from 'lodash/map.js';
import {
  getEntityRemovesSinceMoment,
  getLastState,
} from './revision.service.js';
import db from '#shared/database/index.js';

const { Revision, User } = db;

async function index({ repository, query, opts }, res) {
  const { entity, entityId } = query;
  const where = { repositoryId: repository.id };
  if (entity) {
    where.entity = entity;
    where.state = { id: entityId };
  }
  const include = [
    {
      model: User,
      paranoid: false,
      attributes: ['id', 'email', 'firstName', 'lastName', 'fullName', 'label'],
    },
  ];
  Object.assign(opts, { where, include });
  const { rows, count } = await Revision.findAndCountAll(opts);
  return res.json({ total: count, items: rows });
}

function get({ revision }, res) {
  return res.json(revision);
}

async function getStateAtMoment({ repository, activity, query }, res) {
  const { timestamp } = query;
  const elementIds = (query.elementIds || []).map(Number);
  const removes = await getEntityRemovesSinceMoment(activity, timestamp);
  const entityIds = [...elementIds, ...map(removes.elements, 'state.id')];
  const removedActivityIds = map(removes.activities, 'state.id');
  const elements = await getLastState(
    repository.id,
    entityIds,
    removedActivityIds,
    timestamp,
  );
  return res.json({ data: { ...removes, elements } });
}

export default {
  index,
  get,
  getStateAtMoment,
};
