import React, { useState, useMemo } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { Icons } from '../Icons';

// Sub-components
import { CatalogView } from './CatalogView';
import { CategoryView } from './CategoryView';
import { WarehouseView } from './WarehouseView';
import { ItemForm } from './ItemForm';
import { CategoryForm } from './CategoryForm';
import { WarehouseForm } from './WarehouseForm';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';
import { StockTransferDialog } from './StockTransferDialog';
import { StockCountModule } from './StockCountModule';
import { StockLedgerView } from './StockLedgerView';

// Data
import { INITIAL_ITEMS, INITIAL_CATEGORIES, INITIAL_WAREHOUSES } from '../../../data/inventory-data';

export const InventoryMaster = ({ subModule = 'catalog', onSelectItem }: { subModule?: string; onSelectItem: (item: any) => void }) => {
  // State Hub
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  
  // Selection States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // View Control
  const [activeView, setActiveView] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const selectedItem = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId]);
  const selectedWarehouse = useMemo(() => warehouses.find(w => w.id === selectedWarehouseId), [warehouses, selectedWarehouseId]);
  const selectedCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId), [categories, selectedCategoryId]);

  const handleSaveItem = (formData: any) => {
    setActiveView(null);
  };

  return (
    <div className="w-full h-full relative">
      {subModule === 'activity' && (
        <CatalogView 
          items={items.filter(i => Object.values(i.warehouseStock).reduce((a:any,b:any)=>a+b,0) < (i.minStock||0))} 
          warehouses={warehouses}
          selectedId={selectedId} 
          onSelect={(id) => { setSelectedId(id); onSelectItem(items.find(i => i.id === id)); }}
          onAdd={() => { setModalMode('add'); setActiveView('item'); }}
          onEdit={() => { setModalMode('edit'); setActiveView('item'); }}
          onAdjust={() => setActiveView('adjust')}
          onTransfer={() => setActiveView('transfer')}
          viewTitle="Low Stock Alerts"
        />
      )}

      {subModule === 'catalog' && (
        <CatalogView 
          items={items} 
          warehouses={warehouses}
          selectedId={selectedId} 
          onSelect={(id) => { setSelectedId(id); onSelectItem(items.find(i => i.id === id)); }}
          onAdd={() => { setModalMode('add'); setActiveView('item'); }}
          onEdit={() => { setModalMode('edit'); setActiveView('item'); }}
          onAdjust={() => setActiveView('adjust')}
          onTransfer={() => setActiveView('transfer')}
          viewTitle="Item Master"
        />
      )}

      {subModule === 'categories' && (
        <CategoryView 
          categories={categories} 
          onAdd={() => { setModalMode('add'); setActiveView('category'); }} 
          onEdit={(cat) => { setSelectedCategoryId(cat.id); setModalMode('edit'); setActiveView('category'); }}
          onDelete={(id) => setCategories(categories.filter(c => c.id !== id))}
        />
      )}

      {subModule === 'warehouses' && (
        <WarehouseView 
          warehouses={warehouses}
          items={items}
          selectedWarehouseId={selectedWarehouseId}
          onSelect={setSelectedWarehouseId}
          onAdd={() => { setModalMode('add'); setActiveView('warehouse'); }} 
          onEdit={() => { setModalMode('edit'); setActiveView('warehouse'); }}
          onTransferStock={() => setActiveView('transfer')}
        />
      )}

      {subModule === 'counts' && <StockCountModule />}
      
      {/* New Standing Ledger View */}
      {subModule === 'ledger' && <StockLedgerView />}

      {/* WORKSPACE SHEETS */}
      <Sheet 
        open={activeView === 'item'} 
        onClose={() => setActiveView(null)} 
        title={modalMode === 'add' ? "NEW PRODUCT REGISTRY" : "UPDATE PRODUCT DETAILS"} 
        icon={<Icons.Inventory />}
        size="lg"
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">CANCEL</Button>
            <Button variant="filled" size="md" className="font-black px-10 shadow-2 uppercase tracking-widest" onClick={() => setActiveView(null)}>SAVE TO MASTER</Button>
          </>
        }
      >
        <ItemForm initialData={selectedItem} onSave={handleSaveItem} onCancel={() => setActiveView(null)} />
      </Sheet>

      <Sheet 
        open={activeView === 'category'} 
        onClose={() => setActiveView(null)} 
        title={modalMode === 'add' ? "DEFINE NEW CATEGORY" : "MODIFY CATEGORY"} 
        icon={<Icons.Filter />}
        size="md"
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">CANCEL</Button>
            <Button variant="filled" size="md" className="font-black px-10 shadow-2 uppercase tracking-widest" onClick={() => setActiveView(null)}>UPDATE CATEGORY</Button>
          </>
        }
      >
        <CategoryForm initialData={selectedCategory} onSave={() => setActiveView(null)} onCancel={() => setActiveView(null)} />
      </Sheet>

      <Sheet 
        open={activeView === 'warehouse'} 
        onClose={() => setActiveView(null)} 
        title="WAREHOUSE CONFIGURATION" 
        icon={<Icons.Warehouse />}
        size="md"
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">CANCEL</Button>
            <Button variant="filled" size="md" className="font-black px-10 shadow-2 uppercase tracking-widest" onClick={() => setActiveView(null)}>COMMIT CHANGES</Button>
          </>
        }
      >
        <WarehouseForm initialData={selectedWarehouse} onSave={() => setActiveView(null)} onCancel={() => setActiveView(null)} />
      </Sheet>

      <Sheet 
        open={activeView === 'adjust'} 
        onClose={() => setActiveView(null)} 
        title="STOCK ADJUSTMENT" 
        icon={<Icons.Adjust />}
        size="md"
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">ABORT</Button>
            <Button variant="filled" size="md" className="font-black px-10 shadow-2 uppercase tracking-widest" onClick={() => setActiveView(null)}>POST ADJ. ENTRY</Button>
          </>
        }
      >
        <StockAdjustmentDialog item={selectedItem} warehouses={warehouses} onSave={() => setActiveView(null)} onCancel={() => setActiveView(null)} />
      </Sheet>

      <Sheet 
        open={activeView === 'transfer'} 
        onClose={() => setActiveView(null)} 
        title="INTER-WAREHOUSE TRANSFER" 
        icon={<Icons.Warehouse />}
        size="md"
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">CANCEL</Button>
            <Button variant="filled" size="md" className="font-black px-10 shadow-2 uppercase tracking-widest" onClick={() => setActiveView(null)}>AUTHORIZE MOVEMENT</Button>
          </>
        }
      >
        <StockTransferDialog item={selectedItem} items={items} warehouses={warehouses} onSave={() => setActiveView(null)} onCancel={() => setActiveView(null)} />
      </Sheet>
    </div>
  );
};