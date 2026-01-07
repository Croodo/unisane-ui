import { getNestedValue } from "./getNestedValue";

export const exportCsv = <T extends { id: string }>(
  rows: T[],
  columns: { key: keyof T | string; header?: string }[],
  filenamePrefix = "export"
) => {
  if (!rows.length) return;
  const exportable = columns.filter((col) => String(col.key) !== "actions" && col.header);
  const headers = exportable
    .map((col) => `"${(col.header ?? String(col.key)).replace(/"/g, '""')}"`)
    .join(",");
  const dataRows = rows
    .map((row) =>
      exportable
        .map((col) => {
          const val = getNestedValue(row, String(col.key));
          const stringVal = val == null ? "" : String(val);
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");

  const csvContent = `${headers}\n${dataRows}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
