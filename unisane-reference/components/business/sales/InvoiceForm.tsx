import React, { useState, useMemo } from 'react';
import { TextField } from '../../ui/TextField';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { Divider } from '../../ui/Divider';
import { IconButton } from '../../ui/IconButton';
import { ItemPicker } from '../inventory/ItemPicker';
import { PartyPicker } from '../parties/PartyPicker';
import { cn } from '../../../lib/utils';

interface InvoiceLineItem {
  itemId: string;
  name: string;
  qty: number;
  rate: number;
  tax: number; // percentage
  amount: number;
}

interface InvoiceFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel }) => {
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { itemId: '', name: '', qty: 1, rate: 0, tax: 18, amount: 0 }
  ]);
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPartyPickerOpen, setIsPartyPickerOpen] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.qty * item.rate), 0), [items]);
  const taxTotal = useMemo(() => items.reduce((acc, item) => acc + (item.qty * item.rate * (item.tax / 100)), 0), [items]);
  const grandTotal = subtotal + taxTotal;

  const addItemRow = () => {
    setItems([...items, { itemId: '', name: '', qty: 1, rate: 0, tax: 18, amount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSelectItemFromPicker = (selectedItem: any) => {
    if (activeRowIdx === null) return;
    const newItems = [...items];
    const item = { ...newItems[activeRowIdx] };
    item.itemId = selectedItem.id;
    item.name = selectedItem.name;
    item.rate = selectedItem.price;
    item.tax = parseInt(selectedItem.tax);
    item.amount = item.qty * item.rate;
    newItems[activeRowIdx] = item;
    setItems(newItems);
    setActiveRowIdx(null);
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    item.amount = item.qty * item.rate;
    newItems[index] = item;
    setItems(newItems);
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setIsPartyPickerOpen(true)}
            className="h-14 border border-stone-200 rounded-xs bg-white px-4 flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-colors group relative"
          >
             <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest absolute top-2 left-4">Customer</span>
             <div className="flex items-center justify-between pt-3">
                <span className={cn("font-bold truncate text-sm uppercase", selectedParty ? "text-stone-900" : "text-stone-300")}>
                    {selectedParty?.name || "Select Business Entity..."}
                </span>
                <Icons.Parties size={16} className="text-stone-300 group-hover:text-primary" />
             </div>
          </div>
          <TextField 
            label="INVOICE DATE" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            labelBg="bg-white" 
          />
          <TextField label="DUE DATE" type="date" labelBg="bg-white" />
        </div>

        <Divider className="opacity-40" />

        {/* Line Items */}
        <div className="flex flex-col gap-4">
           <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px_48px] gap-3 px-2">
              <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Item Description</Typography>
              <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px] text-right">Qty</Typography>
              <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px] text-right">Rate</Typography>
              <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px] text-right">Tax (%)</Typography>
              <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px] text-right">Amount</Typography>
              <div />
           </div>

           {items.map((item, idx) => (
             <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_1fr_100px_48px] gap-3 items-start animate-in slide-in-from-top-2 duration-300">
                <div 
                    onClick={() => { setActiveRowIdx(idx); setIsPickerOpen(true); }}
                    className="h-14 border border-stone-200 rounded-xs bg-white px-4 flex flex-col justify-center cursor-pointer hover:border-primary/40 transition-colors group relative"
                >
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest absolute top-2 left-4">Product</span>
                    <div className="flex items-center justify-between pt-3">
                        <span className={cn("font-bold truncate text-sm uppercase", item.name ? "text-stone-900" : "text-stone-300")}>
                            {item.name || "Browse Items..."}
                        </span>
                        <Icons.Search size={16} className="text-stone-300 group-hover:text-primary" />
                    </div>
                </div>
                <TextField type="number" label="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} labelBg="bg-white" />
                <TextField type="number" label="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', Number(e.target.value))} labelBg="bg-white" />
                <TextField type="number" label="Tax" value={item.tax} onChange={e => updateItem(idx, 'tax', Number(e.target.value))} labelBg="bg-white" />
                <div className="pt-4 text-right">
                    <Typography variant="bodyMedium" className="font-black text-stone-900 tabular-nums">₹{item.amount.toLocaleString()}</Typography>
                </div>
                <IconButton onClick={() => removeItemRow(idx)} className="mt-2 text-stone-300 hover:text-error">
                    <Icons.Delete size={20} />
                </IconButton>
             </div>
           ))}
           <div className="flex gap-2">
                <IconButton onClick={addItemRow} className="rounded-xs bg-stone-100 text-stone-900 hover:bg-primary hover:text-white transition-all">
                  <Icons.Add />
                </IconButton>
           </div>
        </div>

        <Divider className="opacity-40" />

        <div className="flex justify-end p-6 bg-stone-50 rounded-xs border border-stone-100">
            <div className="w-full max-w-xs flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase">Sub-Total</Typography>
                    <Typography variant="titleSmall" className="font-black text-stone-800 tabular-nums">₹{subtotal.toLocaleString()}</Typography>
                </div>
                <div className="flex justify-between items-center">
                    <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase">Tax Total</Typography>
                    <Typography variant="titleSmall" className="font-black text-stone-800 tabular-nums">₹{taxTotal.toLocaleString()}</Typography>
                </div>
            </div>
        </div>
      </div>
      <ItemPicker open={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={handleSelectItemFromPicker} />
      <PartyPicker open={isPartyPickerOpen} onClose={() => setIsPartyPickerOpen(false)} onSelect={setSelectedParty} />
    </div>
  );
};