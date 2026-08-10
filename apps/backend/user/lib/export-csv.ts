import type { CsvColumn } from '#shared/util/csv.ts';
import type { UserExportRow } from '../user.service.ts';
import { toCsv } from '#shared/util/csv.ts';

export interface UserCsvOptions {
  includeUserGroups?: boolean;
}

export interface UserCsv {
  filename: string;
  content: string;
}

// Writes dates in the format spreadsheets recognise, so the column can
// be sorted as a date instead of text. Always UTC, so the file doesn't
// change depending on where the admin is.
const formatTimestamp = (date: Date) =>
  date.toISOString().slice(0, 19).replace('T', ' ');

const toFilename = () => `users-${new Date().toISOString().slice(0, 10)}.csv`;

const COLUMNS: CsvColumn<UserExportRow>[] = [
  { header: 'Email', value: (it) => it.email },
  { header: 'First name', value: (it) => it.firstName },
  { header: 'Last name', value: (it) => it.lastName },
  { header: 'Role', value: (it) => it.role },
  { header: 'Date created', value: (it) => formatTimestamp(it.createdAt) },
  { header: 'Status', value: (it) => it.status },
];

const USER_GROUPS_COLUMN: CsvColumn<UserExportRow> = {
  header: 'User groups',
  value: (it) => it.userGroups.join('\n'),
};

/**
 * Renders export rows into a downloadable CSV document, appending the
 * optional user-groups column when the caller asked for it.
 */
export const buildUserCsv = (
  rows: UserExportRow[],
  opts: UserCsvOptions = {},
): UserCsv => {
  const columns = opts.includeUserGroups
    ? [...COLUMNS, USER_GROUPS_COLUMN]
    : COLUMNS;
  return { filename: toFilename(), content: toCsv(columns, rows) };
};
