
import React, { useState } from 'react';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Typography } from '../../ui/Typography';
import { Divider } from '../../ui/Divider';

export const StockAdjustmentDialog = ({ item, warehouses }: any) => {
  const [type, setType] = useState<'add' | 'reduce'>('add');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [qty, setQty] = useState('');
  const [refNo, setRefNo] = useState('');
  const [reason, setReason] = useState('Audit Reconciliation');

  return (
    <div className="flex flex-col bg-white">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2 p-5 bg-stone-900 text-white rounded-xs">
            <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest text-[9px]">Adjusting SKU</Typography>
            <Typography variant="titleLarge" className="font-black text-white uppercase truncate leading-none">{item?.name}</Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Select label="ADJUSTMENT TYPE" value={type} onChange={(v:any) => setType(v)} options={[{label: 'Add Stock (+)', value: 'add'}, {label: 'Reduce Stock (-)', value: 'reduce'}]} />
           <Select label="TARGET LOCATION" value={warehouseId} onChange={setWarehouseId} options={warehouses.map((w:any) => ({label: w.name, value: w.id}))} />
        </div>

        <Divider className="opacity-40" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <TextField label="QUANTITY" type="number" value={qty} onChange={e => setQty(e.target.value)} labelClassName="bg-white" placeholder="0.00" className="text-xl font-black" />
           <TextField label="AUDIT REF NO" value={refNo} onChange={e => setRefNo(e.target.value)} labelClassName="bg-white" placeholder="e.g. ADJ-4421" />
        </div>
        
        <Select 
            label="REASON CODE" 
            value={reason} 
            onChange={setReason} 
            options={[
                {label: 'Audit Reconciliation', value: 'Audit Reconciliation'},
                {label: 'Wastage / Damage', value: 'Wastage / Damage'},
                {label: 'Data Entry Error', value: 'Data Entry Error'},
                {label: 'Sample Issues', value: 'Sample Issues'},
            ]} 
        />
      </div>
    </div>
  );
};
