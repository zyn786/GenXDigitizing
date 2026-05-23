"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  key:       keyof T | string;
  header:    string;
  width?:    string;
  render:    (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns:     Column<T>[];
  data:        T[];
  keyField:    keyof T;
  loading?:    boolean;
  emptyText?:  string;
  emptyIcon?:  string;
  onRowClick?: (row: T) => void;
  className?:  string;
  stickyHead?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading,
  emptyText  = "No data found",
  emptyIcon  = "📭",
  onRowClick,
  className,
  stickyHead,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "text-left px-4 py-2.5",
                  "text-[10px] font-medium uppercase tracking-[0.6px] text-[var(--txt3)]",
                  "border-b border-[var(--border)]",
                  stickyHead && "sticky top-0 z-10 bg-[var(--surface)]"
                )}
                style={col.width ? { width: col.width } : {}}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[13px] text-[var(--txt3)]"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-14 text-center"
              >
                <div className="text-3xl mb-3">{emptyIcon}</div>
                <p className="text-[13px] text-[var(--txt3)]">{emptyText}</p>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  "transition-colors border-b border-[var(--border)] last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--border)]"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-2.5 text-[13px] align-middle text-[var(--txt)]"
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
