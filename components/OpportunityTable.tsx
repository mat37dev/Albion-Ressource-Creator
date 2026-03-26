"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface OpportunityTableProps<T> {
  rows: T[];
  columns: ColumnDef<T>[];
  title?: string;
}

export function OpportunityTable<T>({
  rows,
  columns,
  title,
}: OpportunityTableProps<T>) {
  if (rows.length === 0) return null;

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
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
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
