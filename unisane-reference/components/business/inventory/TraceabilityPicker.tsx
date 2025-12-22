import React, { useState, useMemo } from 'react';
import { Typography } from '../../ui/Typography';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { Badge } from '../../ui/Badge';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Checkbox } from '../../ui/SelectionControls';

interface TraceabilityPickerProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  requiredQty: number;
  unit: string;
  type: 'batch' | 'serial';
  onConfirm: (selections: Record<string, number>) => void;
}

export const TraceabilityPicker: React.FC<TraceabilityPickerProps> = ({
  open,
  onClose,
  itemName,
  requiredQty,
  unit,
  type,
  onConfirm
}) => {
  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Record<string, number>>({});

  const MOCK_BATCHES = [
    { id: 'BAT-2023-X1', expiry: '2024-12-01', available: 150, location: 'WH001' },
    { id: 'BAT-2023-X2', expiry: '2024-06-15', available: 45, location: 'WH001' },
    { id: 'BAT-2023-A9', expiry: '2025-01-10', available: 300, location: 'WH002' },
  ];

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);
  const remaining = requiredQty - totalSelected;

  const handleUpdateQty = (id: string, val: number, max: number) => {
    const qty = Math.min(Math.max(0, val), max);
    setSelections(prev => ({ ...prev, [id]: qty }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      title={type === 'batch' ? "SELECT BATCHES" : "SELECT SERIALS"}
      icon={<Icons.Adjust />}
      contentClassName="p-0"
    >
      <div className="flex flex-col h-[500px] bg-stone-50">
        <div className="p-6 bg-stone-900 text-white flex flex-col gap-1 shrink-0">
          <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">{itemName}</Typography>
          <div className="flex justify-between items-end">
            <Typography variant="headlineSmall" className="font-black">Target: {requiredQty} {unit}</Typography>
            <div className="text-right">
              <span className={cn("text-xs font-black uppercase", remaining === 0 ? "text-emerald-400" : "text-amber-400")}>
                {remaining === 0 ? "ALLOCATED" : `REMAINING: ${remaining} ${unit}`}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-stone-200 bg-white">
          <TextField 
            label="SEARCH BATCHES..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            leadingIcon={<Icons.Search size={18} />}
            labelBg="bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {MOCK_BATCHES.map(batch => (
            <div key={batch.id} className={cn(
              "p-4 bg-white border rounded-xs flex items-center justify-between transition-all",
              selections[batch.id] > 0 ? "border-primary ring-1 ring-primary/10 shadow-sm" : "border-stone-200"
            )}>
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-stone-900 uppercase text-xs">{batch.id}</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase">Exp: {batch.expiry} • {batch.location}</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase mt-1">Available: {batch.available} {unit}</span>
              </div>
              <div className="w-24">
                <TextField 
                  type="number" 
                  label="ALLOCATE" 
                  value={selections[batch.id] || ''} 
                  onChange={e => handleUpdateQty(batch.id, Number(e.target.value), batch.available)}
                  labelBg="bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 bg-white border-t border-stone-200 flex justify-end gap-2 shrink-0">
          <Button variant="text" size="md" onClick={onClose} className="font-black text-stone-400">CANCEL</Button>
          <Button variant="filled" size="md" onClick={() => onConfirm(selections)} disabled={totalSelected === 0} className="font-black px-8">
            COMMIT ALLOCATION
          </Button>
        </footer>
      </div>
    </Dialog>
  );
};