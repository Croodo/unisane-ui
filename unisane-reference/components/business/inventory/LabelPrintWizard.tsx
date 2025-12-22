
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';
import { Icon } from '../../ui/Icon';
import { INITIAL_ITEMS } from '../../../data/inventory-data';

export const LabelPrintWizard = ({ open, onClose, itemId }: { open: boolean, onClose: () => void, itemId: string }) => {
  const item = INITIAL_ITEMS.find(i => i.id === itemId);
  const [labelSize, setLabelSize] = useState('50x25');
  const [qty, setQty] = useState('1');

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        title="Label Design Protocol" 
        icon={<Icon symbol="print" />}
    >
      <div className="flex flex-col gap-8 p-8 bg-white">
        <div className="flex flex-col gap-6">
           <div className="grid grid-cols-2 gap-4">
              <Select 
                label="LABEL DIMENSIONS (MM)" 
                value={labelSize} 
                onChange={setLabelSize}
                options={[
                    {label: '50mm x 25mm (Standard)', value: '50x25'},
                    {label: '38mm x 25mm (Compact)', value: '38x25'},
                    {label: 'A4 Sticky Sheet (3x8)', value: 'a4'}
                ]}
              />
              <TextField label="PRINT QUANTITY" type="number" value={qty} onChange={e => setQty(e.target.value)} labelClassName="bg-white" />
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Hardware Preview</Typography>
           <div className="aspect-video bg-stone-100 border border-stone-200 flex items-center justify-center p-8 relative group overflow-hidden">
               <div className="w-64 h-32 bg-white shadow-lg border border-stone-200 flex flex-col p-4 gap-2 items-center justify-center text-center">
                   <span className="text-[10px] font-black uppercase text-stone-900 truncate w-full">{item?.name}</span>
                   <div className="h-10 w-full flex items-end gap-1 px-4">
                       {[2,4,1,6,2,3,1,5,2,4,1,2,5,1,3,2,1].map((w, i) => <div key={i} className="bg-black h-full" style={{width: w}} />)}
                   </div>
                   <span className="text-[8px] font-mono font-black text-stone-400 tracking-[4px]">{item?.barcode}</span>
               </div>
               <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-[4px]">CALIBRATING...</span>
               </div>
           </div>
        </div>

        <footer className="flex justify-end gap-3 pt-4 border-t border-stone-50">
            <Button variant="text" onClick={onClose} className="font-black">CANCEL</Button>
            <Button variant="filled" className="bg-stone-900 font-black px-10 shadow-2" onClick={onClose}>SEND TO BRIDGE</Button>
        </footer>
      </div>
    </Dialog>
  );
};
