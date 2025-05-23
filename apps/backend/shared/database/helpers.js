import { Op, Sequelize, Utils } from 'sequelize';
import get from 'lodash/get.js';
import has from 'lodash/has.js';
import inRange from 'lodash/inRange.js';
import last from 'lodash/last.js';
import mapValues from 'lodash/mapValues.js';

const { SequelizeMethod } = Utils;
const isFunction = (arg) => typeof arg === 'function';
const notEmpty = (input) => input.length > 0;
const sql = { concat, where };

export { sql, getValidator, setLogging, wrapMethods, parsePath };

export function build(Model) {
  return {
    column: (col, model) => dbColumn(col, model || Model),
    ...mapValues(sqlFunctions, (it) => buildSqlFunc(it, Model)),
  };
}

const dbColumn = (col, Model) => {
  if (col instanceof SequelizeMethod) return col;
  const name = get(Model, `rawAttributes.${col}.field`, col);
  return Sequelize.col(name);
};

export const hasColumn = (Model, col) => {
  if (!col.includes('.')) return has(Model, `rawAttributes.${col}.field`);
  const parsedPath = parsePath(Model, col);
  return !!parsedPath.length;
};

export const subQuery = (model, options) => {
  const sql = model.queryGenerator.selectQuery(model.tableName, options, model);
  return Sequelize.literal(`(${sql.slice(0, -1)})`);
};

function parsePath(Model, path) {
  if (!path.includes('.')) return [dbColumn(path, Model)];
  const [alias, ...columns] = path.split('.');
  const association = Model.associations[alias];
  if (!association) return [];
  const { target: model } = association;
  return [{ model, as: alias }, ...parsePath(model, columns.join('.'))];
}

const sqlFunctions = {
  min: 'MIN',
  max: 'MAX',
  average: 'AVG',
  count: 'COUNT',
  distinct: 'DISTINCT',
  sum: 'SUM',
};

function buildSqlFunc(name, Model) {
  return (col, model) => Sequelize.fn(name, dbColumn(col, model || Model));
}

function getValidator(Model, attribute) {
  return function validate(input) {
    const validator = Model.prototype.validators[attribute];
    if (!validator || !validator.len) {
      return notEmpty(input) || `"${attribute}" can not be empty`;
    }
    const [min, max] = validator.len;
    return (
      inRange(input.length, min, max) ||
      `"${attribute}" must be between ${min} and ${max} characters long`
    );
  };
}

function setLogging(Model, state) {
  const { options } = Model.sequelize;
  options.logging = state;
  return options.logging;
}

function concat(...args) {
  const options = has(last(args), 'separator') ? args.pop() : {};
  if (!options.separator) return Sequelize.fn('concat', ...args);
  return Sequelize.fn('concat_ws', options.separator, ...args);
}

// NOTE: Fixes https://github.com/sequelize/sequelize/issues/6440
function where(attribute, logic, options = {}) {
  const { comparator = '=', scope = false } = options;
  const where = Sequelize.where(attribute, comparator, logic);
  return !scope ? where : { [Op.and]: [where] };
}

function wrapMethods(Model, Promise) {
  let Ctor = Model;
  do {
    const methods = getMethods(Ctor.prototype);
    const staticMethods = getMethods(Ctor);
    [...methods, ...staticMethods].forEach((method) =>
      wrapMethod(method, Promise),
    );
    Ctor = Object.getPrototypeOf(Ctor);
  } while (Ctor !== Sequelize.Model && Ctor !== Function.prototype);
  return Model;
}

function wrapMethod({ key, value, target }, Promise) {
  target[key] = function () {
    const result = value.apply(this, arguments);
    if (!result || !isFunction(result.catch)) return result;
    return Promise.resolve(result);
  };
}

function getMethods(object) {
  return getProperties(object).filter(
    ({ key, value }) => isFunction(value) && key !== 'constructor',
  );
}

function getProperties(object) {
  return Reflect.ownKeys(object).map((key) => {
    const { value } = Reflect.getOwnPropertyDescriptor(object, key);
    return { key, value, target: object };
  });
}
