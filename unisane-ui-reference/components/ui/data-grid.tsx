"use client";

import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Checkbox } from "./checkbox";
import { TextField } from "./text-field";
import { IconButton } from "./icon-button";

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  pageSize?: number;
  searchable?: boolean;
  actions?: (item: T) => React.ReactNode;
}

export function DataGrid<T>({
  data,
  columns,
  keyExtractor,
  selectable = false,
  onSelectionChange,
  pageSize = 10,
  searchable = false,
  actions,
}: DataGridProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((item) =>
      columns.some((col) => {
        const value = (item as any)[col.key];
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
      onSelectionChange?.([]);
    } else {
      const allIds = paginatedData.map(keyExtractor);
      setSelectedIds(allIds);
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];

    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  return (
    <div className="space-y-4u">
      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-3u">
          <TextField
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leadingIcon={<span className="material-symbols-outlined">search</span>}
          />
        </div>
      )}

      {/* Table */}
      <div className="border border-outline-variant rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12u">
                  <Checkbox
                    checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedData.length}
                    onChange={handleSelectAll}
                  />
                </TableHead>
              )}

              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  sortable={col.sortable}
                  sorted={sortConfig?.key === col.key ? sortConfig.direction : false}
                  onSort={() => col.sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  {col.header}
                </TableHead>
              ))}

              {actions && <TableHead className="w-12u">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((item) => {
              const id = keyExtractor(item);
              const isSelected = selectedIds.includes(id);

              return (
                <TableRow key={id} selected={isSelected}>
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(id)}
                      />
                    </TableCell>
                  )}

                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell>
                      {actions(item)}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-body-medium text-on-surface-variant">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </div>

          <div className="flex items-center gap-2u">
            <IconButton
              variant="outlined"
              size="sm"
              ariaLabel="Previous page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </IconButton>

            <div className="text-body-medium">
              Page {currentPage} of {totalPages}
            </div>

            <IconButton
              variant="outlined"
              size="sm"
              ariaLabel="Next page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}