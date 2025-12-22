
import React, { useState, useMemo } from 'react';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { INITIAL_ITEMS } from '../../../data/inventory-data';
import { cn } from '../../../lib/utils';
import { Chip } from '../../ui/Chip';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { RegistryHeader } from '../shared/RegistryComponents';

interface ItemPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
}

export const ItemPicker: React.FC<ItemPickerProps> = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(INITIAL_ITEMS.map(i => i.category)))];

  const filtered = useMemo(() => {
    return INITIAL_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                           item.id.toLowerCase().includes(search.toLowerCase()) ||
                           item.barcode.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        title="Lookup Protocol" 
        icon={<Icons.Inventory />}
        contentClassName="p-0"
    >
      <div className="flex flex-col h-[640px] bg-stone-50">
        <RegistryHeader 
          label="Catalog Reference"
          title="Select Item"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter by name or SKU..."
          className="bg-white"
          subHeader={
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                 <Chip 
                     key={cat} 
                     label={cat} 
                     selected={activeCategory === cat} 
                     onClick={() => setActiveCategory(cat)}
                     variant="filter"
                     className="h-7 text-[10px] font-black uppercase rounded-xs"
                 />
              ))}
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
           <div className="grid grid-cols-[1fr_80px_100px] px-4 py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">
              <span>Identity</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Net Balance</span>
           </div>
           {filtered.map((item) => {
              const totalStock = Object.values(item.warehouseStock).reduce((a: any, b: any) => a + b, 0) as number;
              const isLow = totalStock <= (item.minStock || 0);

              return (
                <div 
                    key={item.id} 
                    onClick={() => { onSelect(item); onClose(); }}
                    className="grid grid-cols-[1fr_80px_100px] items-center p-3 rounded-xs border border-transparent hover:border-primary/20 hover:bg-white cursor-pointer group transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xs bg-stone-100 border border-stone-200 overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                            <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                        </div>
                        <div className="min-w-0">
                            <Typography variant="labelSmall" className="font-black text-stone-800 uppercase tracking-tight truncate block leading-none">{item.name}</Typography>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">{item.id}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <Typography variant="labelSmall" className="font-black text-stone-900 tabular-nums">₹{item.price}</Typography>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <Typography variant="labelSmall" className={cn("font-black tabular-nums", isLow ? "text-error" : "text-emerald-600")}>
                            {totalStock} {item.unit}
                        </Typography>
                        {isLow && <span className="text-[8px] font-black text-error/60 uppercase tracking-tighter leading-none mt-0.5">LOW</span>}
                    </div>
                </div>
              );
           })}
        </div>
        
        <footer className="p-4 bg-white border-t border-stone-200 flex justify-between items-center shrink-0">
            <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase text-[10px]">Registry Hits: {filtered.length}</Typography>
            <Button variant="text" size="sm" className="text-primary font-black uppercase text-[10px]">Add To Master</Button>
        </footer>
      </div>
    </Dialog>
  );
};
