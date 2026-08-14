// CSV serialisation for file-download endpoints.
import Papa from 'papaparse';

// Spreadsheets run a cell starting with one of these as a formula
const FORMULA_TRIGGER = /^[=+\-@\t\r\uFF1D\uFF0B\uFF0D\uFF20]/;

// Byte Order Mark: an invisible U+FEFF at the start of a file marking it
// as UTF-8. Excel garbles non-ASCII names without it.
const BOM = '\uFEFF';

// Row terminator mandated by RFC 4180.
const ROW_SEPARATOR = '\r\n';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | null | undefined;
}

/**
 * Serialises rows into a CSV document with a header line, ready to be
 * sent as an attachment. The columns drive both the header labels and
 * the per-row value extraction.
 */
export const toCsv = <T>(columns: CsvColumn<T>[], rows: T[]): string => {
  const content = Papa.unparse(
    {
      fields: columns.map((it) => it.header),
      // `null` would land as a bare cell; `''` gets quoted like the rest.
      data: rows.map((row) => columns.map((it) => it.value(row) ?? '')),
    },
    { quotes: true, escapeFormulae: FORMULA_TRIGGER, newline: ROW_SEPARATOR },
  );
  return BOM + content + ROW_SEPARATOR;
};
