import React, { useState, useEffect } from 'react';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { ListItem } from '../../ui/List';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Chip } from '../../ui/Chip';
import { Sheet } from '../../ui/Sheet';
import { BOMDetailView } from './BOMDetailView';
import { WorkOrderDetailView } from './WorkOrderDetailView';
import { ManufacturingDashboard } from './ManufacturingDashboard';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper } from '../shared/RegistryComponents';

// Mock Data
const MOCK_BOMS = [
  { id: 'BOM-001', name: 'Polished Granite Slab (Standard)', outputItem: 'ITM001', yield: '100 SqFt', ingredients: 4, estimatedCost: 6500, status: 'Active' },
  { id: 'BOM-002', name: 'Interlocking Tiles (Grey)', outputItem: 'ITM007', yield: '500 Pcs', ingredients: 3, estimatedCost: 12000, status: 'Active' },
];

const MOCK_ORDERS = [
  { id: 'WO-9921', name: 'Batch Run: Granite Polish', bom: 'BOM-001', qty: '400 SqFt', deadline: '28 Oct 2023', status: 'In-Progress', progress: 65, supervisor: 'Ramesh K.' },
  { id: 'WO-9920', name: 'Project: Metro Slabs', bom: 'BOM-001', qty: '1200 SqFt', deadline: '25 Oct 2023', status: 'Completed', progress: 100, supervisor: 'Amit S.' },
];

export const ManufacturingModule = ({ type }: { type: string }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [type]);

  if (type === 'overview') {
    return (
      <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-surface">
         <header className="mb-10 flex flex-col gap-1.5">
            <Typography variant="labelSmall" className="text-amber-600 font-black uppercase tracking-widest text-[11px]">Factory Intelligence</Typography>
            <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Production Oversight</Typography>
         </header>
         <ManufacturingDashboard />
      </div>
    );
  }

  const isBOM = type === 'bom';
  const data = isBOM ? MOCK_BOMS : MOCK_ORDERS;
  const filtered = data.filter((d: any) => d.name.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search));
  const selected = data.find((d: any) => d.id === selectedId);

  return (
    <div className="h-full @container relative isolate">
      <ListDetailLayout
        showDetailMobile={!!selectedId}
        onBackClick={() => setSelectedId(null)}
        list={
          <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
             <RegistryHeader 
               label="Factory Logs"
               title={isBOM ? 'Recipes (BOM)' : 'Work Orders'}
               searchValue={search}
               onSearchChange={setSearch}
               searchPlaceholder={`Search ${isBOM ? 'recipes' : 'orders'}...`}
               action={
                 <Button 
                    variant="filled" 
                    size="md" 
                    icon={<Icons.Add />}
                    onClick={() => setActiveSheet(isBOM ? 'bom' : 'order')} 
                    className="rounded-xs shadow-1 font-black text-[10px] px-6"
                  >
                    {isBOM ? 'ADD RECIPE' : 'START ORDER'}
                  </Button>
               }
             />

             <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Terminal size={48} strokeWidth={1} />}>
              {filtered.map((item: any) => {
                const isActive = selectedId === item.id;
                return (
                  <RegistrySelectionWrapper key={item.id} isActive={isActive}>
                    <ListItem
                      headline={item.name}
                      supportingText={isBOM ? `${item.ingredients} Ingredients • Yield: ${item.yield}` : `${item.qty} • Deadline: ${item.deadline}`}
                      className={cn(
                        "rounded-xs min-h-[80px] transition-all border border-transparent px-4 items-center pt-2", 
                        isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                      )}
                      onClick={() => setSelectedId(item.id)}
                      leadingIcon={<div className={cn("w-10 h-10 rounded-xs flex items-center justify-center font-black transition-colors", isActive ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-500")}><Icons.Terminal size={20} /></div>}
                      trailingIcon={
                        <Chip 
                            label={item.status} 
                            className={cn(
                                "h-5 text-[8px] font-black uppercase rounded-xs border-none px-1.5",
                                item.status === 'Completed' || item.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )} 
                        />
                      }
                    />
                  </RegistrySelectionWrapper>
                )
              })}
            </RegistryList>
          </div>
        }
        detail={
            isBOM ? (
                <BOMDetailView bom={selected} onEdit={() => setActiveSheet('bom')} />
            ) : (
                <WorkOrderDetailView order={selected} onEdit={() => setActiveSheet('order')} />
            )
        }
      />

      <Sheet open={!!activeSheet} onClose={() => setActiveSheet(null)} title={activeSheet === 'bom' ? "PRODUCTION RECIPE CONFIG" : "SCHEDULE WORK ORDER"} icon={<Icons.Terminal />}>
         <div className="p-10 flex flex-col items-center justify-center h-full text-stone-300 opacity-50 grayscale">
            <Icons.Terminal size={64} strokeWidth={1} />
            <Typography variant="labelLarge" className="font-black uppercase tracking-[10px] mt-8">PROTOCOL INTERFACE</Typography>
            <Typography variant="bodySmall" className="font-bold uppercase mt-4">Drafting production logic...</Typography>
         </div>
      </Sheet>
    </div>
  );
};