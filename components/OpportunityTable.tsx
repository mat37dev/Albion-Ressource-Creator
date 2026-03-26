"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  /** If provided, the column becomes sortable using this value extractor */
  sortValue?: (row: T) => string | number;
}

interface OpportunityTableProps<T> {
  rows: T[];
  columns: ColumnDef<T>[];
  title?: string;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
}

export function OpportunityTable<T>({
  rows,
  columns,
  title,
  defaultSortKey,
  defaultSortDir = "desc",
}: OpportunityTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  if (rows.length === 0) return null;

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("desc");
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return 0;
    const av = col.sortValue(a);
    const bv = col.sortValue(b);
    const mul = sortDir === "asc" ? 1 : -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
    return String(av).localeCompare(String(bv)) * mul;
  });

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <div className="overflow-x-auto">
        <table className="albion-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={col.sortValue ? "cursor-pointer select-none hover:text-albion-gold transition-colors whitespace-nowrap" : ""}
                >
                  {col.header}
                  {col.sortValue && (
                    sortKey === col.key ? (
                      sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3 inline ml-1 text-albion-gold" />
                        : <ChevronDown className="h-3 w-3 inline ml-1 text-albion-gold" />
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 inline ml-1 opacity-40" />
                    )
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row, i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
