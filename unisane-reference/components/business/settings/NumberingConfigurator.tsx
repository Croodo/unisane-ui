
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Card } from '../../ui/Card';
import { Divider } from '../../ui/Divider';
import { Switch } from '../../ui/SelectionControls';
import { Icon } from '../../ui/Icon';

export const NumberingConfigurator = () => {
  const [docType, setDocType] = useState('INV');
  const [prefix, setPrefix] = useState('INV/24/');
  const [padding, setPadding] = useState('4');

  const preview = `${prefix}${'0'.repeat(parseInt(padding) - 1)}1`;

  return (
    <div className="flex flex-col gap-12u @container animate-in fade-in duration-500 pb-32">
       <section className="flex flex-col gap-10u">
          <header className="flex items-center gap-4u border-b border-stone-100 pb-5u">
            <div className="w-1.5 h-10 bg-primary rounded-full" />
            <div className="flex flex-col">
              <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter leading-none">Serial Identity Protocol</Typography>
              <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase mt-1">Configure automated voucher sequence logic</Typography>
            </div>
          </header>
          
          <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-10u items-start">
             <div className="flex flex-col gap-8u">
                <Select 
                  label="TARGET DOCUMENT ARCHETYPE" 
                  value={docType} 
                  onChange={setDocType}
                  options={[
                    {label: 'Tax Invoice (Outward)', value: 'INV'},
                    {label: 'Purchase Bill (Inward)', value: 'PB'},
                    {label: 'Sales Order (Internal)', value: 'SO'},
                    {label: 'Delivery Challan (Transit)', value: 'DC'}
                  ]} 
                />
                <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6u">
                    <TextField label="STATIC PREFIX" value={prefix} onChange={e => setPrefix(e.target.value)} labelClassName="bg-white" />
                    <Select 
                        label="ZERO PADDING DEPTH" 
                        value={padding} 
                        onChange={setPadding}
                        options={[{label: '3 Digits (001)', value: '3'}, {label: '4 Digits (0001)', value: '4'}, {label: '5 Digits (00001)', value: '5'}]} 
                    />
                </div>
                <div className="p-8u bg-stone-50 border border-stone-200 rounded-xs flex items-center justify-between gap-6u group hover:border-primary/20 transition-all">
                    <div className="flex flex-col gap-1u">
                        <span className="text-sm font-black text-stone-800 uppercase tracking-tight group-hover:text-primary transition-colors">Automatic Fiscal Reset</span>
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-tight">Restart sequences at 0001 on April 1st annually</span>
                    </div>
                    <Switch defaultChecked />
                </div>
             </div>

             <Card variant="filled" className="bg-stone-900 text-white p-10u md:p-16u rounded-xs flex flex-col justify-center items-center gap-10u border-none shadow-3 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col items-center text-center w-full">
                    <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-[0.4em]">Next Allocated ID</Typography>
                    <div className="mt-10u p-12u border-2 border-dashed border-white/10 rounded-xs bg-white/5 flex flex-col items-center w-full transition-all duration-700 group-hover:border-primary/30 group-hover:bg-primary/5">
                        <Typography variant="displaySmall" className="font-mono font-black text-primary-container tracking-tighter break-all uppercase leading-none">
                            {preview}
                        </Typography>
                        <div className="h-1 w-20 bg-stone-800 mt-8u rounded-full" />
                        <span className="text-[10px] font-black text-stone-500 uppercase mt-6u tracking-[0.3em]">Voucher Mock-up Preview</span>
                    </div>
                    <div className="mt-10u flex items-center gap-4u text-stone-500">
                        <Icon symbol="security" size={20} className="text-stone-700" />
                        <Typography variant="bodySmall" className="uppercase font-bold tracking-tight text-[11px] max-w-[240px]">
                            Registry sequences are immutable once the first record is committed to the ledger.
                        </Typography>
                    </div>
                </div>
                
                {/* Visual context patterns */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-emerald-900 to-transparent opacity-40" />
                <Icon symbol="numbers" size={260} className="absolute -right-20 -bottom-20 opacity-5 rotate-12 scale-150 pointer-events-none group-hover:rotate-0 transition-transform duration-1000" />
             </Card>
          </div>
       </section>
    </div>
  );
};
