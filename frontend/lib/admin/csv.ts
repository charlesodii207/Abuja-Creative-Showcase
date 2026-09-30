// lib/admin/csv.ts
//
// Turns any array of objects already loaded on an admin page into a
// downloadable CSV file, client-side — no backend round trip needed,
// so it always matches exactly what's currently shown on screen
// (search, tab, sort, date filter, whatever the page has applied).

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCsvField(value: string): string {
  // Wrap in quotes (and double up any internal quotes) whenever the
  // field contains a comma, quote, or newline — the standard CSV rule.
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");

  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.value(row);
        return escapeCsvField(raw === null || raw === undefined ? "" : String(raw));
      })
      .join(",")
  );

  // Leading \uFEFF (BOM) so Excel opens accented characters (names with
  // diacritics, e.g. "Ọlá Ṣadé") correctly instead of showing mojibake.
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
): void {
  const csv = toCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/** Today's date as YYYY-MM-DD, for building filenames like "registrants-2026-09-29.csv". */
export function todayForFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
