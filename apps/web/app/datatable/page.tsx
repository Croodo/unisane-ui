"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  DataTableProvider,
  DataTableInner,
  DataTableToolbar,
  DataTablePagination,
  useInlineEditing,
  useSelection,
  useGrouping,
  useColumns,
  useRowContextMenu,
  RowContextMenu,
  useCellSelection,
  usePrint,
  exportData,
  getNestedValue,
  enStrings,
  hiStrings,
  type BulkAction,
  type Density,
  type ExportFormat,
  type RowContextMenuItemOrSeparator,
  type PrintHandler,
} from "@unisane/data-table";
import { Typography, Tabs, TabsList, TabsTrigger, TabsContent, Icon } from "@unisane/ui";

// Components
import { DemoHeader, DemoControls, StatCards, FeatureCard, type LocaleKey, type LocaleOption } from "./components";

// Users Demo
import { type User, generateUsers, userColumns, ExpandedRowContent } from "./demos/users";

// Products Demo
import { type Product, generateProducts, productColumns, ProductExpandedRow } from "./demos/products";

// ─── LOCALE OPTIONS ──────────────────────────────────────────────────────────

const LOCALE_OPTIONS: Record<LocaleKey, LocaleOption> = {
  en: { label: "English", locale: { locale: "en", strings: enStrings } },
  hi: { label: "हिंदी", locale: { locale: "hi", strings: hiStrings } },
};

// ─── USERS TABLE ─────────────────────────────────────────────────────────────

interface UsersTableProps {
  data: User[];
  setData: React.Dispatch<React.SetStateAction<User[]>>;
  features: {
    enableSelection: boolean;
    enableExpansion: boolean;
    enableContextMenu: boolean;
    enableCellSelection: boolean;
    enableRowReorder: boolean;
  };
  density: Density;
  onDensityChange: (d: Density) => void;
}

function UsersTable({ data, setData, features, density, onDensityChange }: UsersTableProps) {
  const { selectedRows, deselectAll } = useSelection();
  const selectedIds = Array.from(selectedRows);
  const { isGrouped, groupByArray, expandedGroups, expandAllGroups, collapseAllGroups } = useGrouping();
  const { pinnedLeftColumns, pinnedRightColumns, resetColumnPins } = useColumns<User>();
  const { menuState, handleRowContextMenu, closeMenu } = useRowContextMenu<User>();

  const columnKeys = useMemo(() => userColumns.map((col) => String(col.key)), []);

  const cellSelection = useCellSelection<User>({
    data,
    columnKeys,
    enabled: features.enableCellSelection,
  });

  const handleCopySelectedCells = useCallback(async () => {
    if (cellSelection.state.selectedCells.size === 0) return;
    const values = cellSelection.getSelectedValues((rowId, columnKey) => {
      const row = data.find((r) => r.id === rowId);
      if (!row) return "";
      return String(getNestedValue(row, columnKey) ?? "");
    });
    const tsv = values.map((row) => row.join("\t")).join("\n");
    await navigator.clipboard.writeText(tsv);
  }, [cellSelection, data]);

  const handleCellKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        handleCopySelectedCells();
        return;
      }
      cellSelection.handleCellKeyDown(event);
    },
    [cellSelection, handleCopySelectedCells]
  );

  const { print, printSelected, isPrinting } = usePrint<User>({
    data,
    columns: userColumns,
    selectedIds: selectedRows,
    defaultOptions: { title: "Users Report", orientation: "landscape", includeTimestamp: true },
  });

  const printHandler: PrintHandler = useMemo(
    () => ({
      onPrint: () => print(),
      onPrintSelected: selectedRows.size > 0 ? () => printSelected() : undefined,
      isPrinting,
    }),
    [print, printSelected, isPrinting, selectedRows.size]
  );

  const inlineEditing = useInlineEditing<User>({
    data,
    onCellChange: async (rowId, columnKey, newValue) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setData((prev) => prev.map((row) => (row.id === rowId ? { ...row, [columnKey]: newValue } : row)));
    },
    validateCell: (_rowId, columnKey, value) => {
      if (columnKey === "salary" && (typeof value !== "number" || Number(value) < 0)) {
        return "Salary must be a positive number";
      }
      if (columnKey === "email" && typeof value === "string" && !value.includes("@")) {
        return "Invalid email address";
      }
      return null;
    },
  });

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: "Export",
        icon: "download",
        onClick: (ids) => {
          const selected = data.filter((d) => ids.includes(d.id));
          exportData({ format: "csv", data: selected, columns: userColumns, filename: "selected-users" });
        },
      },
      {
        label: "Activate",
        icon: "check_circle",
        onClick: (ids) => setData((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, status: "active" } : row))),
      },
      {
        label: "Delete",
        icon: "delete",
        variant: "danger",
        onClick: (ids) => {
          if (confirm(`Delete ${ids.length} users?`)) {
            setData((prev) => prev.filter((row) => !ids.includes(row.id)));
          }
        },
      },
    ],
    [data, setData]
  );

  const contextMenuItems: RowContextMenuItemOrSeparator<User>[] = useMemo(
    () => [
      { key: "view", label: "View details", icon: "visibility", onClick: (row) => alert(`${row.name}\n${row.email}`) },
      { key: "edit", label: "Edit user", icon: "edit", onClick: (row) => alert(`Editing ${row.name}`) },
      { type: "separator" },
      { key: "delete", label: "Delete", icon: "delete", variant: "danger", onClick: (row) => setData((prev) => prev.filter((r) => r.id !== row.id)) },
    ],
    [setData]
  );

  const groupIds = useMemo(() => {
    if (!isGrouped || groupByArray.length === 0) return [];
    const allGroupIds = new Set<string>();
    const buildGroupIds = (rows: User[], keys: string[], parentId: string | null) => {
      if (keys.length === 0 || rows.length === 0) return;
      const currentKey = keys[0]!;
      const remainingKeys = keys.slice(1);
      const groupMap = new Map<string, User[]>();
      for (const row of rows) {
        const value = row[currentKey as keyof User];
        const valueKey = String(value ?? "__null__");
        if (!groupMap.has(valueKey)) groupMap.set(valueKey, []);
        groupMap.get(valueKey)!.push(row);
      }
      for (const [valueKey, groupRows] of groupMap) {
        const groupId = parentId ? `${parentId}::${valueKey}` : valueKey;
        allGroupIds.add(groupId);
        buildGroupIds(groupRows, remainingKeys, groupId);
      }
    };
    buildGroupIds(data, groupByArray, null);
    return Array.from(allGroupIds);
  }, [data, groupByArray, isGrouped]);

  const allGroupsExpanded = isGrouped && groupIds.length > 0 && expandedGroups.size === groupIds.length;
  const handleToggleAllGroups = useCallback(() => {
    if (allGroupsExpanded) collapseAllGroups();
    else expandAllGroups(groupIds);
  }, [allGroupsExpanded, collapseAllGroups, expandAllGroups, groupIds]);

  const handleRowReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setData((prev) => {
        const newData = [...prev];
        const [movedItem] = newData.splice(fromIndex, 1);
        if (movedItem) newData.splice(toIndex, 0, movedItem);
        return newData;
      });
    },
    [setData]
  );

  return (
    <div className="flex flex-col bg-surface isolate border-t border-outline-variant divide-y divide-outline-variant">
      <div className="sticky top-0 z-10 bg-surface">
        <DataTableToolbar
          title="Users"
          searchable
          selectedCount={selectedRows.size}
          selectedIds={selectedIds}
          bulkActions={features.enableSelection ? bulkActions : []}
          onClearSelection={deselectAll}
          exportHandler={{
            onExport: (format: ExportFormat) => exportData({ format, data, columns: userColumns, filename: "all-users" }),
            formats: ["csv", "excel", "pdf", "json"],
          }}
          printHandler={printHandler}
          density={density}
          onDensityChange={onDensityChange}
          isGrouped={isGrouped}
          allGroupsExpanded={allGroupsExpanded}
          onToggleAllGroups={handleToggleAllGroups}
          showGroupingPills={isGrouped}
          frozenLeftCount={pinnedLeftColumns.length}
          frozenRightCount={pinnedRightColumns.length}
          onUnfreezeAll={resetColumnPins}
        />
      </div>

      <DataTableInner
        data={data}
        isLoading={false}
        bulkActions={features.enableSelection ? bulkActions : []}
        renderExpandedRow={features.enableExpansion ? (row) => <ExpandedRowContent row={row} /> : undefined}
        getRowCanExpand={features.enableExpansion ? () => true : undefined}
        onRowContextMenu={features.enableContextMenu ? handleRowContextMenu : undefined}
        density={density}
        virtualize
        virtualizeThreshold={50}
        emptyMessage="No users found"
        emptyIcon="person_off"
        inlineEditing={inlineEditing}
        cellSelectionEnabled={features.enableCellSelection}
        getCellSelectionContext={features.enableCellSelection ? cellSelection.getCellSelectionContext : undefined}
        onCellClick={features.enableCellSelection ? cellSelection.handleCellClick : undefined}
        onCellKeyDown={features.enableCellSelection ? handleCellKeyDown : undefined}
        reorderableRows={features.enableRowReorder}
        onRowReorder={handleRowReorder}
      />

      {features.enableContextMenu && (
        <RowContextMenu state={menuState} onClose={closeMenu} items={contextMenuItems} selectedIds={selectedIds} />
      )}

      <DataTablePagination totalItems={data.length} />
    </div>
  );
}

// ─── PRODUCTS TABLE ──────────────────────────────────────────────────────────

interface ProductsTableProps {
  data: Product[];
  setData: React.Dispatch<React.SetStateAction<Product[]>>;
  features: {
    enableSelection: boolean;
    enableExpansion: boolean;
    enableContextMenu: boolean;
    enableCellSelection: boolean;
    enableRowReorder: boolean;
  };
  density: Density;
  onDensityChange: (d: Density) => void;
}

function ProductsTable({ data, setData, features, density, onDensityChange }: ProductsTableProps) {
  const { selectedRows, deselectAll } = useSelection();
  const selectedIds = Array.from(selectedRows);
  const { isGrouped, groupByArray, expandedGroups, expandAllGroups, collapseAllGroups } = useGrouping();
  const { pinnedLeftColumns, pinnedRightColumns, resetColumnPins } = useColumns<Product>();
  const { menuState, handleRowContextMenu, closeMenu } = useRowContextMenu<Product>();

  const columnKeys = useMemo(() => productColumns.map((col) => String(col.key)), []);

  const cellSelection = useCellSelection<Product>({
    data,
    columnKeys,
    enabled: features.enableCellSelection,
  });

  const handleCopySelectedCells = useCallback(async () => {
    if (cellSelection.state.selectedCells.size === 0) return;
    const values = cellSelection.getSelectedValues((rowId, columnKey) => {
      const row = data.find((r) => r.id === rowId);
      if (!row) return "";
      return String(getNestedValue(row, columnKey) ?? "");
    });
    const tsv = values.map((row) => row.join("\t")).join("\n");
    await navigator.clipboard.writeText(tsv);
  }, [cellSelection, data]);

  const handleCellKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        handleCopySelectedCells();
        return;
      }
      cellSelection.handleCellKeyDown(event);
    },
    [cellSelection, handleCopySelectedCells]
  );

  const { print, printSelected, isPrinting } = usePrint<Product>({
    data,
    columns: productColumns,
    selectedIds: selectedRows,
    defaultOptions: { title: "Products Report", orientation: "landscape", includeTimestamp: true },
  });

  const printHandler: PrintHandler = useMemo(
    () => ({
      onPrint: () => print(),
      onPrintSelected: selectedRows.size > 0 ? () => printSelected() : undefined,
      isPrinting,
    }),
    [print, printSelected, isPrinting, selectedRows.size]
  );

  const inlineEditing = useInlineEditing<Product>({
    data,
    onCellChange: async (rowId, columnKey, newValue) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setData((prev) => prev.map((row) => (row.id === rowId ? { ...row, [columnKey]: newValue } : row)));
    },
    validateCell: (_rowId, columnKey, value) => {
      if (columnKey === "price" && (typeof value !== "number" || Number(value) < 0)) {
        return "Price must be a positive number";
      }
      if (columnKey === "quantity" && (typeof value !== "number" || Number(value) < 0)) {
        return "Quantity must be a positive number";
      }
      return null;
    },
  });

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: "Export",
        icon: "download",
        onClick: (ids) => {
          const selected = data.filter((d) => ids.includes(d.id));
          exportData({ format: "csv", data: selected, columns: productColumns, filename: "selected-products" });
        },
      },
      {
        label: "Activate",
        icon: "check_circle",
        onClick: (ids) => setData((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, status: "active" } : row))),
      },
      {
        label: "Archive",
        icon: "archive",
        onClick: (ids) => setData((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, status: "archived" } : row))),
      },
      {
        label: "Delete",
        icon: "delete",
        variant: "danger",
        onClick: (ids) => {
          if (confirm(`Delete ${ids.length} products?`)) {
            setData((prev) => prev.filter((row) => !ids.includes(row.id)));
          }
        },
      },
    ],
    [data, setData]
  );

  const contextMenuItems: RowContextMenuItemOrSeparator<Product>[] = useMemo(
    () => [
      { key: "view", label: "View details", icon: "visibility", onClick: (row) => alert(`${row.name}\nSKU: ${row.sku}\nPrice: $${row.price}`) },
      { key: "edit", label: "Edit product", icon: "edit", onClick: (row) => alert(`Editing ${row.name}`) },
      { key: "duplicate", label: "Duplicate", icon: "content_copy", onClick: (row) => {
        const newProduct = { ...row, id: `prod-${Date.now()}`, sku: `${row.sku}-COPY`, name: `${row.name} (Copy)` };
        setData((prev) => [...prev, newProduct]);
      }},
      { type: "separator" },
      { key: "archive", label: "Archive", icon: "archive", onClick: (row) => setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "archived" } : r))) },
      { key: "delete", label: "Delete", icon: "delete", variant: "danger", onClick: (row) => setData((prev) => prev.filter((r) => r.id !== row.id)) },
    ],
    [setData]
  );

  const groupIds = useMemo(() => {
    if (!isGrouped || groupByArray.length === 0) return [];
    const allGroupIds = new Set<string>();
    const buildGroupIds = (rows: Product[], keys: string[], parentId: string | null) => {
      if (keys.length === 0 || rows.length === 0) return;
      const currentKey = keys[0]!;
      const remainingKeys = keys.slice(1);
      const groupMap = new Map<string, Product[]>();
      for (const row of rows) {
        const value = row[currentKey as keyof Product];
        const valueKey = String(value ?? "__null__");
        if (!groupMap.has(valueKey)) groupMap.set(valueKey, []);
        groupMap.get(valueKey)!.push(row);
      }
      for (const [valueKey, groupRows] of groupMap) {
        const groupId = parentId ? `${parentId}::${valueKey}` : valueKey;
        allGroupIds.add(groupId);
        buildGroupIds(groupRows, remainingKeys, groupId);
      }
    };
    buildGroupIds(data, groupByArray, null);
    return Array.from(allGroupIds);
  }, [data, groupByArray, isGrouped]);

  const allGroupsExpanded = isGrouped && groupIds.length > 0 && expandedGroups.size === groupIds.length;
  const handleToggleAllGroups = useCallback(() => {
    if (allGroupsExpanded) collapseAllGroups();
    else expandAllGroups(groupIds);
  }, [allGroupsExpanded, collapseAllGroups, expandAllGroups, groupIds]);

  const handleRowReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setData((prev) => {
        const newData = [...prev];
        const [movedItem] = newData.splice(fromIndex, 1);
        if (movedItem) newData.splice(toIndex, 0, movedItem);
        return newData;
      });
    },
    [setData]
  );

  return (
    <div className="flex flex-col bg-surface isolate border-t border-outline-variant divide-y divide-outline-variant">
      <div className="sticky top-0 z-10 bg-surface">
        <DataTableToolbar
          title="Products"
          searchable
          selectedCount={selectedRows.size}
          selectedIds={selectedIds}
          bulkActions={features.enableSelection ? bulkActions : []}
          onClearSelection={deselectAll}
          exportHandler={{
            onExport: (format: ExportFormat) => exportData({ format, data, columns: productColumns, filename: "all-products" }),
            formats: ["csv", "excel", "pdf", "json"],
          }}
          printHandler={printHandler}
          density={density}
          onDensityChange={onDensityChange}
          isGrouped={isGrouped}
          allGroupsExpanded={allGroupsExpanded}
          onToggleAllGroups={handleToggleAllGroups}
          showGroupingPills={isGrouped}
          frozenLeftCount={pinnedLeftColumns.length}
          frozenRightCount={pinnedRightColumns.length}
          onUnfreezeAll={resetColumnPins}
        />
      </div>

      <DataTableInner
        data={data}
        isLoading={false}
        bulkActions={features.enableSelection ? bulkActions : []}
        renderExpandedRow={features.enableExpansion ? (row) => <ProductExpandedRow row={row} /> : undefined}
        getRowCanExpand={features.enableExpansion ? () => true : undefined}
        onRowContextMenu={features.enableContextMenu ? handleRowContextMenu : undefined}
        density={density}
        virtualize
        virtualizeThreshold={50}
        emptyMessage="No products found"
        emptyIcon="inventory_2"
        inlineEditing={inlineEditing}
        cellSelectionEnabled={features.enableCellSelection}
        getCellSelectionContext={features.enableCellSelection ? cellSelection.getCellSelectionContext : undefined}
        onCellClick={features.enableCellSelection ? cellSelection.handleCellClick : undefined}
        onCellKeyDown={features.enableCellSelection ? handleCellKeyDown : undefined}
        reorderableRows={features.enableRowReorder}
        onRowReorder={handleRowReorder}
      />

      {features.enableContextMenu && (
        <RowContextMenu state={menuState} onClose={closeMenu} items={contextMenuItems} selectedIds={selectedIds} />
      )}

      <DataTablePagination totalItems={data.length} />
    </div>
  );
}

// ─── MAIN DEMO PAGE ──────────────────────────────────────────────────────────

export default function DataTableDemoPage() {
  const [activeTab, setActiveTab] = useState<"users" | "products">("users");

  // Users data
  const [usersData, setUsersData] = useState<User[]>(() => generateUsers(150));

  // Products data
  const [productsData, setProductsData] = useState<Product[]>(() => generateProducts(200));

  // Feature toggles
  const [enableSelection, setEnableSelection] = useState(true);
  const [enableExpansion, setEnableExpansion] = useState(true);
  const [enableZebra, setEnableZebra] = useState(false);
  const [enableColumnBorders, setEnableColumnBorders] = useState(false);
  const [enableResizable, setEnableResizable] = useState(true);
  const [enablePinnable, setEnablePinnable] = useState(true);
  const [enableMultiSort, setEnableMultiSort] = useState(true);
  const [enableReorderable, setEnableReorderable] = useState(true);
  const [enableGrouping, setEnableGrouping] = useState(true);
  const [enableSummary, setEnableSummary] = useState(true);
  const [enableContextMenu, setEnableContextMenu] = useState(true);
  const [enableCellSelection, setEnableCellSelection] = useState(true);
  const [enableRowReorder, setEnableRowReorder] = useState(true);
  const [density, setDensity] = useState<Density>("standard");
  const [localeKey, setLocaleKey] = useState<LocaleKey>("en");

  const features = useMemo(
    () => [
      { label: "Selection", checked: enableSelection, onChange: setEnableSelection },
      { label: "Expansion", checked: enableExpansion, onChange: setEnableExpansion },
      { label: "Zebra Stripes", checked: enableZebra, onChange: setEnableZebra },
      { label: "Column Borders", checked: enableColumnBorders, onChange: setEnableColumnBorders },
      { label: "Resizable Columns", checked: enableResizable, onChange: setEnableResizable },
      { label: "Pinnable Columns", checked: enablePinnable, onChange: setEnablePinnable },
      { label: "Multi-Sort", checked: enableMultiSort, onChange: setEnableMultiSort },
      { label: "Column Reorder", checked: enableReorderable, onChange: setEnableReorderable },
      { label: "Row Grouping", checked: enableGrouping, onChange: setEnableGrouping },
      { label: "Summary Row", checked: enableSummary, onChange: setEnableSummary },
      { label: "Context Menu", checked: enableContextMenu, onChange: setEnableContextMenu },
      { label: "Cell Selection", checked: enableCellSelection, onChange: setEnableCellSelection },
      { label: "Row Reorder", checked: enableRowReorder, onChange: setEnableRowReorder },
    ],
    [
      enableSelection, enableExpansion, enableZebra, enableColumnBorders,
      enableResizable, enablePinnable, enableMultiSort, enableReorderable,
      enableGrouping, enableSummary, enableContextMenu, enableCellSelection, enableRowReorder,
    ]
  );

  const tableFeatures = {
    enableSelection,
    enableExpansion,
    enableContextMenu,
    enableCellSelection,
    enableRowReorder,
  };

  // Stats for current tab
  const usersStats = useMemo(
    () => [
      { title: "Total Users", value: usersData.length },
      { title: "Active Users", value: usersData.filter((d) => d.status === "active").length },
      { title: "Total Salary", value: (usersData.reduce((sum, d) => sum + d.salary, 0) / 1000000).toFixed(1), prefix: "$", suffix: "M" },
    ],
    [usersData]
  );

  const productsStats = useMemo(
    () => [
      { title: "Total Products", value: productsData.length },
      { title: "Active Products", value: productsData.filter((d) => d.status === "active").length },
      { title: "Total Inventory", value: productsData.reduce((sum, d) => sum + d.quantity, 0).toLocaleString(), suffix: " units" },
    ],
    [productsData]
  );

  return (
    <div className="min-h-screen">
      <DemoHeader
        title="DataTable Demo"
        description="A comprehensive demonstration of all DataTable features. Switch between Users and Products demos to see the component in different contexts."
      />

      <DemoControls
        features={features}
        density={density}
        onDensityChange={setDensity}
        localeKey={localeKey}
        onLocaleChange={setLocaleKey}
        localeOptions={LOCALE_OPTIONS}
      />

      {/* Demo Tabs */}
      <div className="py-6">
        <div className="max-w-[1600px] mx-auto px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "products")}>
            <TabsList className="mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Icon symbol="group" className="w-5 h-5" />
                Users Management
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Icon symbol="inventory_2" className="w-5 h-5" />
                Products Catalog
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="overflow-hidden rounded-sm">
                <DataTableProvider
                  tableId="users-demo-table"
                  columns={userColumns}
                  mode="local"
                  paginationMode="offset"
                  variant={enableColumnBorders ? "grid" : "list"}
                  selectable={enableSelection}
                  columnBorders={enableColumnBorders}
                  zebra={enableZebra}
                  stickyHeader
                  resizable={enableResizable}
                  pinnable={enablePinnable}
                  reorderable={enableReorderable}
                  groupingEnabled={enableGrouping}
                  showSummary={enableSummary}
                  summaryLabel="Totals"
                  maxSortColumns={enableMultiSort ? 3 : 1}
                  initialPageSize={25}
                  locale={LOCALE_OPTIONS[localeKey].locale}
                >
                  <UsersTable
                    data={usersData}
                    setData={setUsersData}
                    features={tableFeatures}
                    density={density}
                    onDensityChange={setDensity}
                  />
                </DataTableProvider>
              </div>
              <StatCards stats={usersStats} />
            </TabsContent>

            <TabsContent value="products">
              <div className="overflow-hidden rounded-sm">
                <DataTableProvider
                  tableId="products-demo-table"
                  columns={productColumns}
                  mode="local"
                  paginationMode="offset"
                  variant={enableColumnBorders ? "grid" : "list"}
                  selectable={enableSelection}
                  columnBorders={enableColumnBorders}
                  zebra={enableZebra}
                  stickyHeader
                  resizable={enableResizable}
                  pinnable={enablePinnable}
                  reorderable={enableReorderable}
                  groupingEnabled={enableGrouping}
                  showSummary={enableSummary}
                  summaryLabel="Summary"
                  maxSortColumns={enableMultiSort ? 3 : 1}
                  initialPageSize={25}
                  locale={LOCALE_OPTIONS[localeKey].locale}
                >
                  <ProductsTable
                    data={productsData}
                    setData={setProductsData}
                    features={tableFeatures}
                    density={density}
                    onDensityChange={setDensity}
                  />
                </DataTableProvider>
              </div>
              <StatCards stats={productsStats} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Features Documentation */}
        <div className="max-w-[1600px] mx-auto px-6 mt-8 space-y-6">
          <Typography variant="headlineSmall" className="text-on-surface">
            Features Demonstrated
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon="search" title="Search & Filter" description="Use the search bar in the toolbar. Click filter icons on column headers for column-specific filtering." />
            <FeatureCard icon="view_column" title="Column Visibility" description="Click 'Columns' button in toolbar to show/hide columns. Settings persist to localStorage." />
            <FeatureCard icon="table_rows" title="Density Toggle" description="Click 'Density' button in toolbar to switch between compact, dense, standard, and comfortable modes." />
            <FeatureCard icon="download" title="Export" description="Click 'Export' button in toolbar to download data as CSV, Excel, PDF, or JSON." />
            <FeatureCard icon="sort" title="Multi-Sort" description="Click column headers to sort. Shift+Click to add secondary/tertiary sort columns." />
            <FeatureCard icon="check_box" title="Selection & Bulk Actions" description="Select rows with checkboxes. Bulk actions appear in toolbar when items are selected." />
            <FeatureCard icon="expand_more" title="Row Expansion" description="Click the expand icon to reveal additional row details." />
            <FeatureCard icon="edit" title="Inline Editing" description="Double-click editable cells. Enter to save, Escape to cancel." />
            <FeatureCard icon="width" title="Column Resizing" description="Drag column borders to resize. Widths persist to localStorage." />
            <FeatureCard icon="push_pin" title="Column Pinning" description="Right-click column header to pin left/right. Pinned columns stay visible during scroll." />
            <FeatureCard icon="drag_indicator" title="Column Reordering" description="Drag column headers to reorder. Non-pinned columns can be dragged to change position." />
            <FeatureCard icon="swap_vert" title="Row Drag-to-Reorder" description="Drag the handle on the left of each row to reorder. Alt+Arrow for keyboard reordering." />
            <FeatureCard icon="workspaces" title="Multi-level Grouping" description="Right-click column header → 'Group by' for hierarchical groups with aggregations." />
            <FeatureCard icon="functions" title="Summary Row" description="Shows aggregated values (sum, average) in a footer row." />
            <FeatureCard icon="menu" title="Context Menu" description="Right-click any row for context actions: View, Edit, Duplicate, Delete." />
            <FeatureCard icon="select_all" title="Cell Selection" description="Click cells to select, Shift+Click for range, Ctrl+C to copy." />
            <FeatureCard icon="print" title="Print View" description="Click Print for a printer-friendly view with optimized layout." />
            <FeatureCard icon="translate" title="Internationalization" description="Built-in support for multiple languages. Toggle between English and Hindi." />
          </div>
        </div>
      </div>
    </div>
  );
}
