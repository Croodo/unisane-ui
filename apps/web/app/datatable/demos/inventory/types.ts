// ─── INVENTORY ITEM TYPES ─────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  brand: string;
  unit: UnitType;

  // Stock Management
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;

  // Pricing
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  taxRate: number; // percentage
  discount: number; // percentage

  // Billing Info
  hsnCode: string; // HSN/SAC code for GST
  barcode: string;

  // Supplier Info
  supplierId: string;
  supplierName: string;
  leadTimeDays: number;

  // Status & Dates
  status: InventoryStatus;
  lastRestockDate: string;
  lastSaleDate: string;
  expiryDate?: string;

  // Location
  warehouseLocation: string;
  shelfNumber: string;

  // Metrics
  totalSold: number;
  totalRevenue: number;
  avgMonthlySales: number;
}

export type InventoryCategory =
  | "Electronics"
  | "Groceries"
  | "Clothing"
  | "Pharmaceuticals"
  | "Hardware"
  | "Stationery"
  | "Home & Kitchen"
  | "Sports"
  | "Automotive"
  | "Beauty & Personal Care";

export type UnitType =
  | "Piece"
  | "Kg"
  | "Gram"
  | "Liter"
  | "Ml"
  | "Meter"
  | "Box"
  | "Pack"
  | "Dozen"
  | "Pair";

export type InventoryStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "discontinued"
  | "on_order";

export const inventoryCategories: InventoryCategory[] = [
  "Electronics",
  "Groceries",
  "Clothing",
  "Pharmaceuticals",
  "Hardware",
  "Stationery",
  "Home & Kitchen",
  "Sports",
  "Automotive",
  "Beauty & Personal Care",
];

export const unitTypes: UnitType[] = [
  "Piece",
  "Kg",
  "Gram",
  "Liter",
  "Ml",
  "Meter",
  "Box",
  "Pack",
  "Dozen",
  "Pair",
];

export const inventoryStatuses: InventoryStatus[] = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "discontinued",
  "on_order",
];

// ─── SUPPLIER TYPE ────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
}

export const suppliers: Supplier[] = [
  { id: "sup-001", name: "Global Supplies Co.", contact: "+91 98765 43210", email: "sales@globalsupplies.com" },
  { id: "sup-002", name: "QuickStock Ltd.", contact: "+91 87654 32109", email: "orders@quickstock.in" },
  { id: "sup-003", name: "Prime Distributors", contact: "+91 76543 21098", email: "bulk@primedist.com" },
  { id: "sup-004", name: "Metro Wholesale", contact: "+91 65432 10987", email: "metro@wholesale.in" },
  { id: "sup-005", name: "National Traders", contact: "+91 54321 09876", email: "info@nationaltraders.com" },
];

// ─── WAREHOUSE LOCATIONS ──────────────────────────────────────────────────────

export const warehouseLocations = [
  "Warehouse A - Main",
  "Warehouse B - North",
  "Warehouse C - South",
  "Store Front",
  "Cold Storage",
];
