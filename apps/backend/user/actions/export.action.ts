import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';
import { audit } from '#shared/audit.ts';
import { buildUserCsv } from '../lib/export-csv.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';

export default defineAction({
  name: 'exportUsers',
  query: schemas.ExportFilter,
  openapi: {
    authenticated: true,
    summary: 'Export users as CSV',
    description: oneLine`
      Streams the full match set for the given filters as a
      CSV attachment. Archived users are excluded unless \`archived\` is
      set, in which case the Status column distinguishes them.
    `,
    responses: {
      200: { description: 'CSV attachment (text/csv; charset=utf-8).' },
    },
  },
  async handler({ query, res, user }) {
    const rows = await service.exportRows(query);
    const { filename, content } = buildUserCsv(rows, query);
    audit('user:export', 'success', {
      actorId: user.id,
      count: rows.length,
      includeArchived: !!query.archived,
      includeUserGroups: !!query.includeUserGroups,
    });
    res.attachment(filename);
    res.type('text/csv; charset=utf-8');
    return res.send(content);
  },
});
