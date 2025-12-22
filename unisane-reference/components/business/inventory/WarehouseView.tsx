import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { ListItem } from '../../ui/List';
import { Icons } from '../Icons';
import { WarehouseDetailView } from './WarehouseDetailView';
import { cn } from '../../../lib/utils';
import { Avatar } from '../../ui/Avatar';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper } from '../shared/RegistryComponents';

interface WarehouseViewProps {
  warehouses: any[];
  items: any[];
  selectedWarehouseId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onEdit: () => void;
  onTransferStock: () => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ 
  warehouses, items, selectedWarehouseId, onSelect, onAdd, onEdit, onTransferStock 
}) => {
  const [query, setQuery] = useState('');

  const filtered = warehouses.filter(w => 
    w.name.toLowerCase().includes(query.toLowerCase()) || 
    w.manager.toLowerCase().includes(query.toLowerCase())
  );

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  return (
    <ListDetailLayout
      showDetailMobile={!!selectedWarehouseId}
      onBackClick={() => onSelect(null)}
      list={
        <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
          <RegistryHeader 
            label="Logistics Network"
            title="Stock Hubs"
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search warehouses..."
            action={
              <Button variant="filled" size="md" icon={<Icons.Add />} onClick={onAdd} className="rounded-xs shadow-1 font-black text-[10px] px-6">
                ADD HUB
              </Button>
            }
          />

          <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Warehouse size={48} strokeWidth={1} />}>
            {filtered.map((wh) => {
              const isActive = selectedWarehouseId === wh.id;
              return (
                <RegistrySelectionWrapper key={wh.id} isActive={isActive}>
                  <ListItem
                    headline={wh.name}
                    supportingText={`${wh.manager} • ${wh.phone}`}
                    className={cn(
                      "rounded-xs min-h-[88px] py-3 px-3 transition-all border border-transparent items-start", 
                      isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                    )}
                    onClick={() => onSelect(wh.id)}
                    leadingIcon={
                      <Avatar size="md" fallback={wh.name[0]} className={cn(
                          "rounded-xs font-black transition-colors shrink-0 mt-0.5", 
                          isActive ? "bg-primary text-white" : "bg-stone-200 text-stone-500"
                      )}>
                        <Icons.Warehouse size={20} />
                      </Avatar>
                    }
                    trailingIcon={
                      <div className="flex flex-col items-end gap-1.5 pt-1">
                          <span className="font-black text-[11px] text-stone-900 uppercase">
                              {wh.capacity} USED
                          </span>
                          <Typography variant="labelSmall" className="text-[8px] font-black uppercase text-stone-400 leading-none">
                              {wh.items} SKUS
                          </Typography>
                      </div>
                    }
                  />
                </RegistrySelectionWrapper>
              );
            })}
          </RegistryList>
        </div>
      }
      detail={
        <WarehouseDetailView 
          warehouse={selectedWarehouse} 
          allItemRecords={items}
          onEdit={onEdit}
          onTransfer={onTransferStock}
        />
      }
    />
  );
};