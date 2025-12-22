
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Switch } from '../../ui/SelectionControls';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Divider } from '../../ui/Divider';
import { TextField } from '../../ui/TextField';
import { Icon } from '../../ui/Icon';

export const PrintSettings = () => {
  return (
    <div className="flex flex-col gap-12u @container animate-in fade-in duration-500 pb-32">
       <section className="flex flex-col gap-8u">
          <header className="flex items-center gap-4u border-b border-stone-100 pb-4u">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <Typography variant="titleLarge" className="font-black text-stone-800 uppercase tracking-tight">Print Architecture</Typography>
          </header>
          
          <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-10u">
             {/* Left: Preview Section */}
             <Card variant="outlined" className="p-8u @md:p-12u bg-stone-50 border-stone-200 rounded-xs flex flex-col gap-8u items-center">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest w-full">Active A4 Blueprint</Typography>
                <div className="aspect-[1/1.414] w-full max-w-[280px] @md:max-w-[340px] bg-white border border-stone-200 shadow-2 rounded-none p-8u flex flex-col gap-4u relative group overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                   <div className="h-6u w-1/2 bg-stone-100 rounded-full" />
                   <div className="h-px bg-stone-100 w-full mt-4u" />
                   <div className="space-y-2u">
                      <div className="h-3u w-full bg-stone-50 rounded-full" />
                      <div className="h-3u w-[90%] bg-stone-50 rounded-full" />
                      <div className="h-3u w-[95%] bg-stone-50 rounded-full" />
                   </div>
                   <div className="mt-auto flex justify-between items-end opacity-20">
                      <div className="w-16u h-8u border border-stone-200" />
                      <div className="w-20u h-3u bg-stone-200 rounded-full" />
                   </div>
                   <div className="absolute inset-0 bg-stone-900/90 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4u">
                      <div className="p-4u rounded-full bg-white/10 text-white"><Icon symbol="zoom_in" size={32} /></div>
                      <Button variant="filled" size="md" className="bg-white text-stone-900 font-black text-[10px] h-10u">PREVIEW BLUEPRINT</Button>
                   </div>
                </div>
                <Button variant="tonal" className="w-full font-black text-[10px] h-12u bg-white border border-stone-200 shadow-sm">MODIFY TEMPLATE ENGINE</Button>
             </Card>

             {/* Right: Logic Toggles */}
             <div className="flex flex-col gap-6u">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Document Logic Overrides</Typography>
                <div className="grid grid-cols-1 gap-4u">
                   {[
                      { l: 'Product Identity Visualization', d: 'Display thumbnails in document rows' },
                      { l: 'Statutory HSN Mapping', d: 'Required for B2B tax compliance' },
                      { l: 'Lifecycle Balance Tracking', d: 'Append previous outstanding to footer' },
                      { l: 'Dynamic QR Payment Nodes', d: 'Print UPI code for instant settlement' },
                   ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5u bg-white border border-stone-100 rounded-xs hover:border-primary/20 transition-all group">
                         <div className="flex flex-col gap-0.5u">
                            <span className="text-sm font-black text-stone-800 uppercase tracking-tight group-hover:text-primary transition-colors">{item.l}</span>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">{item.d}</span>
                         </div>
                         <Switch defaultChecked={i < 2} />
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </section>

       <Divider className="opacity-40" />

       <section className="flex flex-col gap-8u">
          <header className="flex items-center gap-4u">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <Typography variant="titleLarge" className="font-black text-stone-800 uppercase tracking-tight">Voucher Legal Blocks</Typography>
          </header>
          <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-8u">
             <TextField 
                label="GENERAL TERMS & CONDITIONS" 
                multiline 
                rows={4} 
                defaultValue="1. Goods once sold will not be taken back. 2. Subject to Mumbai Jurisdiction. 3. Interest @18% charged for delayed payments." 
                labelClassName="bg-white"
             />
             <TextField 
                label="TREASURY / BANK DETAILS (FOOTER)" 
                multiline 
                rows={4} 
                defaultValue="UNISANE INDUSTRIAL SLABS PVT LTD - HDFC BANK - A/C: 502000XXXXXX - IFSC: HDFC0000001 - BRANCH: BHIWANDI HQ" 
                labelClassName="bg-white"
             />
          </div>
       </section>
    </div>
  );
};
