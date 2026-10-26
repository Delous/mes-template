'use client';

import { Box, Table } from '@radix-ui/themes';
import { Fragment, type Key, type ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  expandedRow,
  label,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  expandedRow?: (row: T) => ReactNode;
  label?: string;
}) {
  return (
    <Box overflowX="auto">
      <Table.Root variant="surface" aria-label={label}>
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.ColumnHeaderCell key={column.key}>{column.header}</Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => {
            const expanded = expandedRow?.(row);
            return (
              <Fragment key={rowKey(row)}>
                <Table.Row align="start">
                  {columns.map((column) => (
                    <Table.Cell key={column.key}>{column.cell(row)}</Table.Cell>
                  ))}
                </Table.Row>
                {expanded ? (
                  <Table.Row>
                    <Table.Cell colSpan={columns.length}>{expanded}</Table.Cell>
                  </Table.Row>
                ) : null}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
