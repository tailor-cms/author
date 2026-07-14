'use strict';

const TABLE_NAME = 'asset';
const INDEX_NAME = 'idx_asset_storage_key';

exports.up = async (qi, { Op }) => {
  await qi.addIndex(TABLE_NAME, ['storage_key'], {
    name: INDEX_NAME,
    // Only file-backed assets carry a storage key (LINK assets are null) -
    // a partial index keeps it small and skips the ones that never match.
    where: { storage_key: { [Op.ne]: null } },
  });
};

exports.down = (qi) => qi.removeIndex(TABLE_NAME, INDEX_NAME);
