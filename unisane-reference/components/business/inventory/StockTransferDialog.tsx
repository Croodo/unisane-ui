
import React, { useState, useMemo } from 'react';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';

interface StockTransferDialogProps {
  item?: any; // Selected item if coming from catalog
  items?: any[]; // All items for selection if coming from warehouse
  warehouses: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const StockTransferDialog: React.FC<StockTransferDialogProps> = ({ 
  item: initialItem, items = [], warehouses 
}) => {
  const [itemId, setItemId] = useState(initialItem?.id || '');
  const [fromWh, setFromWh] = useState(warehouses[0]?.id || '');
  const [toWh, setToWh] = useState(warehouses[1]?.id || '');
  const [qty, setQty] = useState('');

  const currentItem = useMemo(() => 
    initialItem || items.find(i => i.id === itemId), 
  [itemId, initialItem, items]);

  const available = useMemo(() => 
    currentItem?.warehouseStock?.[fromWh] || 0, 
  [currentItem, fromWh]);

  return (
    <div className="flex flex-col bg-white">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        {!initialItem && (
           <Select 
             label="SELECT ITEM TO TRANSFER" 
             value={itemId} 
             onChange={setItemId} 
             options={items.map(i => ({ label: i.name, value: i.id }))} 
           />
        )}

        <div className="flex items-center justify-between p-6 bg-stone-900 text-white rounded-xs shadow-2">
           <div>
              <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Balance in Source Hub</Typography>
              <Typography variant="headlineSmall" className="font-black mt-1">
                {available} <span className="text-xs uppercase text-stone-500">{currentItem?.unit || ''}</span>
              </Typography>
           </div>
           <Icons.Warehouse size={32} className="text-primary opacity-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
           <Select label="SOURCE LOCATION" value={fromWh} onChange={setFromWh} options={warehouses.map((w:any) => ({label: w.name, value: w.id}))} />
           <Select label="DESTINATION" value={toWh} onChange={setToWh} options={warehouses.map((w:any) => ({label: w.name, value: w.id}))} />
        </div>

        <TextField 
          label="QUANTITY TO MOVE" 
          type="number" 
          value={qty} 
          onChange={e => setQty(e.target.value)} 
          labelClassName="bg-white" 
          className="text-xl font-black"
          error={Number(qty) > available}
          helperText={Number(qty) > available ? "Insufficient stock at source" : "Move stock between hubs"}
        />
      </div>
    </div>
  );
};
