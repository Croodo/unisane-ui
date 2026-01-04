"use client";

import React, { memo, useMemo } from "react";
import { cn, Button, Icon } from "@unisane/ui";
import { usePagination } from "../context";
import { useI18n } from "../i18n";

// ─── PAGE SIZE OPTIONS ─────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

// ─── PAGINATION PROPS ──────────────────────────────────────────────────────

interface DataTablePaginationProps {
  /** Total number of items */
  totalItems?: number;
  /** Current page count (for remote data) */
  currentCount?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Pagination mode */
  mode?: "offset" | "cursor";
  /** Cursor pagination controls */
  cursor?: {
    nextCursor?: string;
    prevCursor?: string;
    onNext: () => void;
    onPrev: () => void;
    pageIndex?: number;
  };
}

// ─── PAGINATION INFO ───────────────────────────────────────────────────────

function PaginationInfo({
  page,
  pageSize,
  totalItems,
  currentCount,
}: {
  page: number;
  pageSize: number;
  totalItems?: number;
  currentCount?: number;
}) {
  const { t, formatNumber } = useI18n();
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems ?? currentCount ?? 0);
  const total = totalItems ?? currentCount ?? 0;

  if (total === 0) {
    return <span className="text-body-small text-on-surface-variant">{t("noItems")}</span>;
  }

  return (
    <span className="text-body-small text-on-surface-variant">
      {t("rangeOfTotal", { start: formatNumber(start), end: formatNumber(end), total: formatNumber(total) })}
    </span>
  );
}

// ─── PAGE SIZE SELECTOR ────────────────────────────────────────────────────

function PageSizeSelector({
  pageSize,
  pageSizeOptions,
  onChange,
}: {
  pageSize: number;
  pageSizeOptions: number[];
  onChange: (size: number) => void;
}) {
  return (
    <select
      value={pageSize}
      onChange={(e) => onChange(Number(e.target.value))}
      // WCAG 2.5.5: min 44px touch target
      className="min-h-[44px] min-w-[60px] px-3 text-body-small bg-surface border border-outline-variant rounded-sm text-on-surface cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {pageSizeOptions.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  );
}

// ─── OFFSET PAGINATION ─────────────────────────────────────────────────────

function OffsetPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  setPage,
  setPageSize,
  pageSizeOptions,
}: {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
}) {
  const { t } = useI18n();
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2 bg-surface-container-low">
      {/* Info - hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block">
        <PaginationInfo page={page} pageSize={pageSize} totalItems={totalItems} />
      </div>

      {/* Controls - stacked on mobile, inline on tablet+ */}
      <div className="flex items-center justify-between sm:justify-end gap-2">
        {/* Page info on mobile (compact) */}
        <span className="text-body-small text-on-surface-variant sm:hidden">
          {page}/{totalPages}
        </span>

        {/* Page size selector - left of navigation buttons */}
        <PageSizeSelector
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onChange={setPageSize}
        />

        <div className="flex items-center gap-1">
          {/* First page - hidden on mobile */}
          <Button
            variant="text"
            size="sm"
            onClick={() => setPage(1)}
            disabled={!canGoPrev}
            aria-label={t("previous")}
            className="hidden sm:flex min-h-[44px] min-w-[44px]"
          >
            <Icon symbol="first_page" className="w-5 h-5" />
          </Button>

          <Button
            variant="text"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={!canGoPrev}
            aria-label={t("previous")}
            className="min-h-[44px] min-w-[44px]"
          >
            <Icon symbol="chevron_left" className="w-5 h-5" />
          </Button>

          {/* Page indicator - hidden on mobile (shown above), visible on tablet+ */}
          <span className="hidden sm:block text-body-small text-on-surface px-2 min-w-[80px] text-center">
            {t("pageOfTotal", { page, totalPages })}
          </span>

          <Button
            variant="text"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!canGoNext}
            aria-label={t("next")}
            className="min-h-[44px] min-w-[44px]"
          >
            <Icon symbol="chevron_right" className="w-5 h-5" />
          </Button>

          {/* Last page - hidden on mobile */}
          <Button
            variant="text"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={!canGoNext}
            aria-label={t("next")}
            className="hidden sm:flex min-h-[44px] min-w-[44px]"
          >
            <Icon symbol="last_page" className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── CURSOR PAGINATION ─────────────────────────────────────────────────────

function CursorPagination({
  pageSize,
  currentCount,
  cursor,
  setPageSize,
  pageSizeOptions,
}: {
  pageSize: number;
  currentCount?: number;
  cursor: NonNullable<DataTablePaginationProps["cursor"]>;
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
}) {
  const { t, formatNumber } = useI18n();
  const hasPrev = !!cursor.prevCursor;
  const hasNext = !!cursor.nextCursor;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2 bg-surface-container-low">
      {/* Info - hidden on mobile */}
      <span className="hidden sm:block text-body-small text-on-surface-variant">
        {t("cursorPagination", { count: formatNumber(currentCount ?? 0), page: cursor.pageIndex ?? 1 })}
      </span>

      {/* Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-2">
        {/* Mobile info */}
        <span className="sm:hidden text-body-small text-on-surface-variant">
          {t("cursorPagination", { count: formatNumber(currentCount ?? 0), page: cursor.pageIndex ?? 1 })}
        </span>

        {/* Page size selector - left of navigation buttons */}
        <PageSizeSelector
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onChange={setPageSize}
        />

        <div className="flex items-center gap-1">
          <Button
            variant="text"
            size="sm"
            onClick={cursor.onPrev}
            disabled={!hasPrev}
            aria-label={t("previous")}
            className="min-h-[44px]"
          >
            <Icon symbol="chevron_left" className="w-5 h-5" />
            <span className="hidden sm:inline">{t("previous")}</span>
          </Button>

          <Button
            variant="text"
            size="sm"
            onClick={cursor.onNext}
            disabled={!hasNext}
            aria-label={t("next")}
            className="min-h-[44px]"
          >
            <span className="hidden sm:inline">{t("next")}</span>
            <Icon symbol="chevron_right" className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGINATION COMPONENT ──────────────────────────────────────────────────

function DataTablePaginationInner({
  totalItems,
  currentCount,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  mode = "offset",
  cursor,
}: DataTablePaginationProps) {
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const totalPages = useMemo(() => {
    if (!totalItems) return 1;
    return Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)));
  }, [totalItems, pageSize]);

  if (mode === "cursor" && cursor) {
    return (
      <CursorPagination
        pageSize={pageSize}
        currentCount={currentCount}
        cursor={cursor}
        setPageSize={setPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    );
  }

  return (
    <OffsetPagination
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
      setPage={setPage}
      setPageSize={setPageSize}
      pageSizeOptions={pageSizeOptions}
    />
  );
}

export const DataTablePagination = memo(DataTablePaginationInner);
