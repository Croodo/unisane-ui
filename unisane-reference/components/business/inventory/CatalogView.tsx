import React, { useState } from 'react';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { ListItem } from '../../ui/List';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { ItemDetailView } from './ItemDetailView';
import { cn } from '../../../lib/utils';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper, RegistryContainer } from '../shared/RegistryComponents';

interface CatalogViewProps {
  items: any[];
  warehouses: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  onAdjust: () => void;
  onTransfer: () => void;
  viewTitle?: string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ 
  items, warehouses, selectedId, onSelect, onAdd, onEdit, onAdjust, onTransfer, viewTitle = "Item Master" 
}) => {
  const [query, setQuery] = useState('');

  const calculateTotal = (item: any) => Object.values(item.warehouseStock).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number;
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.id.toLowerCase().includes(query.toLowerCase()));

  return (
    <ListDetailLayout
      className="border-none shadow-none bg-transparent"
      showDetailMobile={!!selectedId}
      onBackClick={() => onSelect('')}
      list={
        <RegistryContainer className="bg-stone-50">
          <RegistryHeader 
            label="Commercial Registry"
            title={viewTitle}
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search by name or SKU..."
            action={viewTitle === "Item Master" && (
              <Button variant="filled" size="md" icon={<Icons.Add />} onClick={onAdd} className="rounded-xs shadow-1 font-black px-6">
                ADD ITEM
              </Button>
            )}
          />

          <RegistryList isEmpty={filtered.length === 0} emptyLabel="No items found">
            {filtered.map((item) => {
              const total = calculateTotal(item);
              const isLow = total < (item.minStock || 0);
              const isActive = selectedId === item.id;
              
              return (
                <RegistrySelectionWrapper key={item.id} isActive={isActive}>
                  <ListItem
                    headline={item.name}
                    supportingText={`${total} ${item.unit} • ${item.category}`}
                    className={cn(
                      "rounded-xs min-h-[88px] py-3 px-3 transition-all border border-transparent items-start", 
                      isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                    )}
                    onClick={() => onSelect(item.id)}
                    trailingSupportingText={
                      <div className="flex flex-col items-end gap-2 pt-0.5">
                        <span className={cn("text-[10px] font-mono font-bold leading-none", isActive ? "text-primary" : "text-stone-400")}>
                          {item.id}
                        </span>
                        {isLow && (
                          <div className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-xs leading-none bg-rose-50 text-rose-600 border border-rose-100">
                            LOW STOCK
                          </div>
                        )}
                      </div>
                    }
                    leadingIcon={
                      <div className={cn(
                        "w-12 h-12 rounded-xs overflow-hidden border transition-colors bg-white shrink-0 mt-0.5",
                        isActive ? "border-primary/30" : "border-stone-200"
                      )}>
                        <img src={item.imageUrl} className={cn("w-full h-full object-cover", isActive ? "" : "grayscale opacity-80")} alt={item.name} />
                      </div>
                    }
                  />
                </RegistrySelectionWrapper>
              );
            })}
          </RegistryList>
        </RegistryContainer>
      }
      detail={
        <div className="h-full bg-white">
          <ItemDetailView 
            item={items.find(i => i.id === selectedId)} 
            warehouses={warehouses}
            onEdit={onEdit} 
            onAdjust={onAdjust} 
            onTransfer={onTransfer}
          />
        </div>
      }
    />
  );
};