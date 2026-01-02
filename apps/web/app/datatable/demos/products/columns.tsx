"use client";

import { Icon } from "@unisane/ui";
import { createActionsColumn, type Column, type RowContextMenuItemOrSeparator } from "@unisane/data-table";
import type { Product, ProductStatus, ProductVisibility, ProductCategory } from "./types";
import { categories, statuses, visibilities, brands } from "./types";

// ─── PRODUCT ACTION ITEMS ─────────────────────────────────────────────────────

export function createProductActionItems(
  onEdit: (product: Product) => void,
  onDuplicate: (product: Product) => void,
  onArchive: (product: Product) => void,
  onDelete: (product: Product) => void
): RowContextMenuItemOrSeparator<Product>[] {
  return [
    {
      key: "view",
      label: "View details",
      icon: "visibility",
      onClick: (row) => alert(`${row.name}\nSKU: ${row.sku}\nPrice: $${row.price}`)
    },
    {
      key: "edit",
      label: "Edit product",
      icon: "edit",
      onClick: onEdit
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: "content_copy",
      onClick: onDuplicate
    },
    { type: "separator" },
    {
      key: "archive",
      label: "Archive",
      icon: "archive",
      onClick: onArchive,
      visible: (row) => row.status !== "archived"
    },
    {
      key: "delete",
      label: "Delete",
      icon: "delete",
      variant: "danger",
      onClick: onDelete
    },
  ];
}

// ─── CREATE ACTIONS COLUMN ────────────────────────────────────────────────────

export function createProductActionsColumn(
  onEdit: (product: Product) => void,
  onDuplicate: (product: Product) => void,
  onArchive: (product: Product) => void,
  onDelete: (product: Product) => void
): Column<Product> {
  return createActionsColumn<Product>({
    items: createProductActionItems(onEdit, onDuplicate, onArchive, onDelete),
    pinned: "right",
  });
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const config: Record<ProductStatus, { bg: string; text: string; icon: string }> = {
    active: { bg: "bg-primary/10", text: "text-primary", icon: "check_circle" },
    draft: { bg: "bg-tertiary/10", text: "text-tertiary", icon: "edit_note" },
    archived: { bg: "bg-outline/10", text: "text-outline", icon: "archive" },
    out_of_stock: { bg: "bg-error/10", text: "text-error", icon: "inventory_2" },
  };

  const { bg, text, icon } = config[status];
  const label = status.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-small capitalize ${bg} ${text}`}>
      <Icon symbol={icon} className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ─── VISIBILITY BADGE ────────────────────────────────────────────────────────

function VisibilityBadge({ visibility }: { visibility: ProductVisibility }) {
  const config: Record<ProductVisibility, { icon: string; label: string }> = {
    visible: { icon: "visibility", label: "Visible" },
    hidden: { icon: "visibility_off", label: "Hidden" },
    catalog_only: { icon: "menu_book", label: "Catalog" },
    search_only: { icon: "search", label: "Search" },
  };

  const { icon, label } = config[visibility];

  return (
    <span className="inline-flex items-center gap-1 text-on-surface-variant text-label-small">
      <Icon symbol={icon} className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ─── CATEGORY BADGE ──────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: ProductCategory }) {
  const config: Record<ProductCategory, { bg: string; icon: string }> = {
    electronics: { bg: "bg-blue-500/10 text-blue-600", icon: "devices" },
    clothing: { bg: "bg-pink-500/10 text-pink-600", icon: "checkroom" },
    home: { bg: "bg-amber-500/10 text-amber-600", icon: "home" },
    sports: { bg: "bg-green-500/10 text-green-600", icon: "sports_soccer" },
    beauty: { bg: "bg-purple-500/10 text-purple-600", icon: "spa" },
    toys: { bg: "bg-orange-500/10 text-orange-600", icon: "toys" },
  };

  const { bg, icon } = config[category];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-label-small capitalize ${bg}`}>
      <Icon symbol={icon} className="w-3.5 h-3.5" />
      {category}
    </span>
  );
}

// ─── RATING STARS ────────────────────────────────────────────────────────────

function RatingDisplay({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1">
      <Icon symbol="star" className="w-4 h-4 text-amber-500" />
      <span className="text-body-small font-medium">{rating.toFixed(1)}</span>
      <span className="text-label-small text-on-surface-variant">({reviewCount})</span>
    </div>
  );
}

// ─── STOCK INDICATOR ─────────────────────────────────────────────────────────

function StockIndicator({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return <span className="text-error text-label-small font-medium">Out of stock</span>;
  }
  if (quantity < 10) {
    return <span className="text-tertiary text-label-small font-medium">Low: {quantity}</span>;
  }
  return <span className="text-primary text-label-small">{quantity} in stock</span>;
}

// ─── COLUMN DEFINITIONS ──────────────────────────────────────────────────────

export const productColumns: Column<Product>[] = [
  {
    key: "name",
    header: "Product",
    sortable: true,
    filterable: true,
    pinnable: true,
    editable: true,
    width: 300,
    minWidth: 250,
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden shrink-0">
          <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-body-medium text-on-surface font-medium truncate">{row.name}</span>
          <span className="text-label-small text-on-surface-variant font-mono">{row.sku}</span>
        </div>
      </div>
    ),
  },
  {
    key: "category",
    header: "Category",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: categories.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    width: 140,
    align: "center",
    groupable: true,
    render: (row) => <CategoryBadge category={row.category} />,
  },
  {
    key: "brand",
    header: "Brand",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: brands.map((b) => ({ label: b, value: b })),
    width: 130,
    hideable: true,
    groupable: true,
  },
  {
    key: "price",
    header: "Price",
    sortable: true,
    editable: true,
    inputType: "number",
    width: 130,
    align: "end",
    pinnable: true,
    summary: "average",
    render: (row) => (
      <div className="flex flex-col items-end">
        <span className="font-mono font-medium text-on-surface">${row.price.toFixed(2)}</span>
        {row.compareAtPrice && (
          <span className="text-label-small text-on-surface-variant line-through">
            ${row.compareAtPrice.toFixed(2)}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "cost",
    header: "Cost",
    sortable: true,
    editable: true,
    inputType: "number",
    width: 100,
    align: "end",
    hideable: true,
    summary: "average",
    render: (row) => <span className="font-mono text-on-surface-variant">${row.cost.toFixed(2)}</span>,
  },
  {
    key: "quantity",
    header: "Stock",
    sortable: true,
    editable: true,
    inputType: "number",
    width: 120,
    align: "center",
    summary: "sum",
    render: (row) => <StockIndicator quantity={row.quantity} />,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: statuses.map((s) => ({ label: s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), value: s })),
    width: 140,
    align: "center",
    groupable: true,
    render: (row) => <ProductStatusBadge status={row.status} />,
  },
  {
    key: "visibility",
    header: "Visibility",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: visibilities.map((v) => ({ label: v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), value: v })),
    width: 110,
    align: "center",
    hideable: true,
    render: (row) => <VisibilityBadge visibility={row.visibility} />,
  },
  {
    key: "rating",
    header: "Rating",
    sortable: true,
    width: 130,
    align: "center",
    hideable: true,
    summary: "average",
    render: (row) => <RatingDisplay rating={row.rating} reviewCount={row.reviewCount} />,
  },
  {
    key: "updatedAt",
    header: "Updated",
    sortable: true,
    width: 120,
    hideable: true,
    render: (row) => (
      <span className="text-on-surface-variant text-body-small">
        {new Date(row.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    ),
  },
];
