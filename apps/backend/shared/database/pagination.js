import pick from 'lodash/pick.js';
import { StatusCodes } from 'http-status-codes';
import { hasColumn, parsePath } from './helpers.js';
import { createError } from '#shared/error/helpers.js';

const parseOptions = ({ limit, offset, sortOrder }) => ({
  limit: parseInt(limit, 10) || 100,
  offset: parseInt(offset, 10) || 0,
  sortOrder: ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'ASC',
});

function processPagination(Model, processScopedAttrs = true) {
  return (req, _, next) => {
    const options = parseOptions(req.query);
    Object.assign(req.query, options);
    req.options = pick(options, ['limit', 'offset']);
    const { sortBy } = req.query;
    if (!sortBy) return next();
    if (!hasColumn(Model, sortBy)) {
      return createError(StatusCodes.BAD_REQUEST, `Invalid column: ${sortBy}`);
    }
    if (processScopedAttrs) {
      req.options.order = [[...parsePath(Model, sortBy), options.sortOrder]];
    } else {
      req.options.order = [[sortBy, options.sortOrder]];
    }
    return next();
  };
}

export { processPagination };
