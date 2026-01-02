"use client";

import { Icon, Badge } from "@unisane/ui";
import { createActionsColumn, type Column, type RowContextMenuItemOrSeparator } from "@unisane/data-table";
import type { InventoryItem, InventoryStatus } from "./types";
import { inventoryCategories, inventoryStatuses, warehouseLocations } from "./types";

// ─── INVENTORY ACTION ITEMS ───────────────────────────────────────────────────

export function createInventoryActionItems(
  onEdit: (item: InventoryItem) => void,
  onRestock: (item: InventoryItem) => void,
  onAdjustStock: (item: InventoryItem) => void,
  onViewHistory: (item: InventoryItem) => void,
  onDelete: (item: InventoryItem) => void
): RowContextMenuItemOrSeparator<InventoryItem>[] {
  return [
    {
      key: "view",
      label: "View details",
      icon: "visibility",
      onClick: (row) => alert(`SKU: ${row.sku}\nName: ${row.name}\nStock: ${row.currentStock} ${row.unit}\nPrice: ₹${row.sellingPrice}`)
    },
    {
      key: "edit",
      label: "Edit item",
      icon: "edit",
      onClick: onEdit
    },
    { type: "separator" },
    {
      key: "restock",
      label: "Create restock order",
      icon: "add_shopping_cart",
      onClick: onRestock,
      visible: (row) => row.status !== "discontinued"
    },
    {
      key: "adjust",
      label: "Adjust stock",
      icon: "inventory_2",
      onClick: onAdjustStock
    },
    {
      key: "history",
      label: "View stock history",
      icon: "history",
      onClick: onViewHistory
    },
    { type: "separator" },
    {
      key: "delete",
      label: "Delete item",
      icon: "delete",
      variant: "danger",
      onClick: onDelete,
      disabled: (row) => row.currentStock > 0
    },
  ];
}

// ─── CREATE ACTIONS COLUMN ────────────────────────────────────────────────────

export function createInventoryActionsColumn(
  onEdit: (item: InventoryItem) => void,
  onRestock: (item: InventoryItem) => void,
  onAdjustStock: (item: InventoryItem) => void,
  onViewHistory: (item: InventoryItem) => void,
  onDelete: (item: InventoryItem) => void
): Column<InventoryItem> {
  return createActionsColumn<InventoryItem>({
    items: createInventoryActionItems(onEdit, onRestock, onAdjustStock, onViewHistory, onDelete),
    pinned: "right",
  });
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InventoryStatus }) {
  const config: Record<InventoryStatus, { label: string; color: string; icon: string }> = {
    in_stock: { label: "In Stock", color: "bg-primary/10 text-primary", icon: "check_circle" },
    low_stock: { label: "Low Stock", color: "bg-tertiary/10 text-tertiary", icon: "warning" },
    out_of_stock: { label: "Out of Stock", color: "bg-error/10 text-error", icon: "error" },
    discontinued: { label: "Discontinued", color: "bg-on-surface/10 text-on-surface-variant", icon: "block" },
    on_order: { label: "On Order", color: "bg-secondary/10 text-secondary", icon: "local_shipping" },
  };

  const { label, color, icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-small ${color}`}>
      <Icon symbol={icon} className="text-[14px]" />
      {label}
    </span>
  );
}

// ─── STOCK LEVEL INDICATOR ────────────────────────────────────────────────────

function StockLevelIndicator({ current, min, max }: { current: number; min: number; max: number }) {
  const percentage = Math.min((current / max) * 100, 100);
  const isLow = current <= min;
  const isCritical = current === 0;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical ? "bg-error" : isLow ? "bg-tertiary" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-label-small font-mono min-w-[40px] text-right ${
        isCritical ? "text-error" : isLow ? "text-tertiary" : "text-on-surface"
      }`}>
        {current}
      </span>
    </div>
  );
}

// ─── PRICE CELL ───────────────────────────────────────────────────────────────

function PriceCell({ cost, selling, mrp, discount }: { cost: number; selling: number; mrp: number; discount: number }) {
  const margin = ((selling - cost) / cost * 100).toFixed(1);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <span className="font-mono text-on-surface font-medium">₹{selling.toLocaleString()}</span>
        {discount > 0 && (
          <span className="text-label-small text-primary">-{discount}%</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-label-small text-on-surface-variant">
        <span className="line-through">₹{mrp.toLocaleString()}</span>
        <span className="text-primary">+{margin}%</span>
      </div>
    </div>
  );
}

// ─── COLUMN DEFINITIONS ───────────────────────────────────────────────────────

export const inventoryColumns: Column<InventoryItem>[] = [
  {
    key: "sku",
    header: "SKU",
    sortable: true,
    filterable: true,
    pinnable: true,
    width: 130,
    render: (row) => (
      <div className="flex flex-col">
        <span className="font-mono text-on-surface font-medium">{row.sku}</span>
        <span className="text-label-small text-on-surface-variant font-mono">{row.barcode.slice(0, 8)}...</span>
      </div>
    ),
  },
  {
    key: "name",
    header: "Product Name",
    sortable: true,
    filterable: true,
    editable: true,
    width: 250,
    minWidth: 180,
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-on-surface font-medium truncate">{row.name}</span>
        <span className="text-label-small text-on-surface-variant">{row.brand}</span>
      </div>
    ),
  },
  {
    key: "category",
    header: "Category",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: inventoryCategories.map((c) => ({ label: c, value: c })),
    groupable: true,
    width: 150,
    hideable: true,
    render: (row) => (
      <Badge variant="tonal" className="text-label-small">
        {row.category}
      </Badge>
    ),
  },
  {
    key: "currentStock",
    header: "Stock Level",
    sortable: true,
    width: 160,
    align: "center",
    summary: "sum",
    render: (row) => (
      <StockLevelIndicator current={row.currentStock} min={row.minStockLevel} max={row.maxStockLevel} />
    ),
  },
  {
    key: "unit",
    header: "Unit",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { label: "Piece", value: "Piece" },
      { label: "Kg", value: "Kg" },
      { label: "Liter", value: "Liter" },
      { label: "Box", value: "Box" },
      { label: "Pack", value: "Pack" },
    ],
    width: 80,
    align: "center",
    hideable: true,
  },
  {
    key: "sellingPrice",
    header: "Price",
    sortable: true,
    width: 140,
    align: "end",
    render: (row) => (
      <PriceCell cost={row.costPrice} selling={row.sellingPrice} mrp={row.mrp} discount={row.discount} />
    ),
  },
  {
    key: "costPrice",
    header: "Cost",
    sortable: true,
    editable: true,
    inputType: "number",
    width: 100,
    align: "end",
    hideable: true,
    summary: "average",
    render: (row) => <span className="font-mono text-on-surface-variant">₹{row.costPrice.toLocaleString()}</span>,
  },
  {
    key: "taxRate",
    header: "Tax %",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: [
      { label: "5%", value: "5" },
      { label: "12%", value: "12" },
      { label: "18%", value: "18" },
      { label: "28%", value: "28" },
    ],
    width: 80,
    align: "center",
    hideable: true,
    render: (row) => (
      <span className="font-mono text-on-surface-variant">{row.taxRate}%</span>
    ),
  },
  {
    key: "hsnCode",
    header: "HSN",
    sortable: true,
    filterable: true,
    width: 90,
    align: "center",
    hideable: true,
    render: (row) => <span className="font-mono text-on-surface-variant">{row.hsnCode}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: inventoryStatuses.map((s) => ({
      label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: s,
    })),
    width: 140,
    align: "center",
    pinnable: true,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "supplierName",
    header: "Supplier",
    sortable: true,
    filterable: true,
    groupable: true,
    width: 160,
    hideable: true,
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-on-surface truncate">{row.supplierName}</span>
        <span className="text-label-small text-on-surface-variant">{row.leadTimeDays} days lead time</span>
      </div>
    ),
  },
  {
    key: "warehouseLocation",
    header: "Location",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: warehouseLocations.map((w) => ({ label: w, value: w })),
    groupable: true,
    width: 160,
    hideable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <Icon symbol="location_on" className="text-[16px] text-on-surface-variant" />
        <div className="flex flex-col">
          <span className="text-on-surface text-label-medium truncate">{row.warehouseLocation}</span>
          <span className="text-label-small text-on-surface-variant">Shelf {row.shelfNumber}</span>
        </div>
      </div>
    ),
  },
  {
    key: "totalSold",
    header: "Units Sold",
    sortable: true,
    width: 100,
    align: "end",
    hideable: true,
    aggregation: "sum",
    summary: "sum",
    render: (row) => <span className="font-mono text-on-surface">{row.totalSold.toLocaleString()}</span>,
  },
  {
    key: "totalRevenue",
    header: "Revenue",
    sortable: true,
    width: 120,
    align: "end",
    hideable: true,
    aggregation: "sum",
    summary: "sum",
    render: (row) => <span className="font-mono text-primary font-medium">₹{row.totalRevenue.toLocaleString()}</span>,
  },
  {
    key: "lastRestockDate",
    header: "Last Restock",
    sortable: true,
    width: 120,
    hideable: true,
    render: (row) => (
      <span className="text-on-surface-variant">
        {new Date(row.lastRestockDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </span>
    ),
  },
  {
    key: "expiryDate",
    header: "Expiry",
    sortable: true,
    width: 110,
    hideable: true,
    render: (row) => {
      if (!row.expiryDate) return <span className="text-on-surface-variant">-</span>;

      const expiry = new Date(row.expiryDate);
      const now = new Date();
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpiringSoon = daysUntil <= 90;
      const isExpired = daysUntil < 0;

      return (
        <span className={`${isExpired ? "text-error" : isExpiringSoon ? "text-tertiary" : "text-on-surface-variant"}`}>
          {expiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
          {isExpiringSoon && !isExpired && (
            <Icon symbol="warning" className="text-[14px] ml-1 inline" />
          )}
        </span>
      );
    },
  },
];
