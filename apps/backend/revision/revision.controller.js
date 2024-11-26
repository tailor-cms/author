import map from 'lodash/map.js';
import {
  getEntityRemovesSinceMoment,
  getLastState,
} from './revision.service.js';
import db from '#shared/database/index.js';

const { Activity, Revision, User } = db;

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

async function getStateAtMoment({ query }, res) {
  const { activityId, timestamp } = query;
  const elementIds = (query.elementIds || []).map(Number);
  const activity = await Activity.findByPk(activityId);
  const removes = await getEntityRemovesSinceMoment(activity, timestamp);
  const entityIds = [...elementIds, ...map(removes.elements, 'state.id')];
  const removedActivityIds = map(removes.activities, 'state.id');
  const elements = await getLastState(entityIds, removedActivityIds, timestamp);
  return res.json({ data: { ...removes, elements } });
}

function get({ revision }, res) {
  return res.json(revision);
}

export default {
  index,
  getStateAtMoment,
  get,
};
