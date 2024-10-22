import InsertLocation from './insertLocation';

const { AddAfter, Reorder } = InsertLocation;

interface PositionConfig {
  newPosition: number;
  items: any[];
  isFirstChild?: boolean;
  action?: InsertLocation;
  count?: number;
}

const distributePositions = (
  { lower = 0, upper = 0 },
  count: number,
): number[] => {
  const delta = upper ? (upper - lower) / (count + 1) : 1;
  return Array.from({ length: count }).map((_, i) => delta * (i + 1) + lower);
};

function getDeprecationWarning(config: PositionConfig) {
  if (!Object.hasOwn(config, 'isFirstChild')) return;
  console.warn(`Deprecation notice:
    'isFirstChild' option is deprecated and no longer used!
    Providing it does not affect this function.`);
}

export const getPositions = (items: any[], index: number, count = 1) => {
  const { position: lower } = items[index - 1] || {};
  const { position: upper } = items[index] || {};
  return distributePositions({ lower, upper }, count);
};

/**
 * Calculates item position(s) based on the options provided.
 * @param {number} config.newPosition The index of the anchor item by which the new
 *     positions will be calculated. Defaults to the end of the `items` array.
 * @param {Object[]} config.items An array of objects in which we are determining
 *     item's new position.
 * @param {boolean} config.isFirstChild Deprecated: Boolean value denoting whether
 *     the item should be placed as the first child of its parent.
 * @param {InsertLocation} [config.action=Reorder]
 *     A string value determining where the item should be placed
 *     in relation to `newPosition`.
 *     AddBefore returns position(s) placed before the anchor element.
 *     AddAfter returns position(s) placed after the anchor element.
 *     Reorder returns calculated position(s) based on `position` property of
 *     adjacent elements.
 *     Defaults to Reorder.
 * @param {number} config.count A number of items for which position needs to be
 *     determinate.
 * @return {(number|Array)} Single position if `count` is 1 or an array containing
 *     `count` positions.
 */
export function calculatePosition(config: PositionConfig) {
  const { newPosition, items, action = Reorder, count = 1 } = config;
  getDeprecationWarning(config);
  const arr = [...items];
  if (action === Reorder) arr.splice(newPosition, count);
  let index = items.length;
  if (newPosition !== undefined) {
    index = action === AddAfter ? newPosition + 1 : newPosition;
  }
  const positions = getPositions(arr, index, count);
  return count === 1 ? positions[0] : positions;
}
