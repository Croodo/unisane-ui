
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Badge } from '../../ui/Badge';
import { INITIAL_ITEMS } from '../../../data/inventory-data';
import { cn } from '../../../lib/utils';

export const GlobalSearchPage = ({ query }: { query: string }) => {
  return (
    <div className="h-full flex flex-col bg-stone-50 animate-in fade-in duration-500">
      <header className="p-8 md:p-12 bg-white border-b border-stone-200 shrink-0">
         <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest">Protocol Search Results</Typography>
         <div className="flex items-baseline gap-4 mt-2">
            <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase">"{query}"</Typography>
            <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase tracking-tight">12 Entries Identified</Typography>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-6xl mx-auto flex flex-col gap-12 pb-32">
          
          {/* Result Section: Items */}
          <section className="flex flex-col gap-5">
             <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                <Icons.Inventory className="text-stone-400" size={20} />
                <Typography variant="labelLarge" className="font-black text-stone-400 uppercase tracking-widest">Master Data (Items)</Typography>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INITIAL_ITEMS.slice(0, 3).map(item => (
                  <Card key={item.id} variant="outlined" interactive className="p-5 bg-white border-stone-200 rounded-xs flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xs overflow-hidden border border-stone-100 shrink-0">
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                     </div>
                     <div className="min-w-0">
                        <span className="font-black text-stone-900 uppercase text-[11px] truncate block leading-none">{item.name}</span>
                        <span className="text-[10px] font-bold text-stone-400 uppercase mt-1.5">{item.id}</span>
                     </div>
                  </Card>
                ))}
             </div>
          </section>

          {/* Result Section: Documents */}
          <section className="flex flex-col gap-5">
             <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                <Icons.File className="text-stone-400" size={20} />
                <Typography variant="labelLarge" className="font-black text-stone-400 uppercase tracking-widest">Voucher Registry (Docs)</Typography>
             </div>
             <div className="flex flex-col gap-2">
                {[
                  { id: 'INV-2023-102', party: 'Raj Construction', date: '26 Oct', val: '₹45,000' },
                  { id: 'PB-2023-441', party: 'Stone Mines India', date: '22 Oct', val: '₹88,000' }
                ].map(doc => (
                  <div key={doc.id} className="p-5 bg-white border border-stone-200 rounded-xs flex items-center justify-between hover:border-primary/40 cursor-pointer transition-all">
                    <div className="flex items-center gap-6">
                       <span className="font-black text-primary font-mono text-[12px]">{doc.id}</span>
                       <span className="font-black text-stone-800 uppercase text-[12px]">{doc.party}</span>
                    </div>
                    <div className="flex items-center gap-10">
                       <span className="text-[10px] font-bold text-stone-400 uppercase">{doc.date}</span>
                       <span className="text-[12px] font-black text-stone-900 tabular-nums">{doc.val}</span>
                    </div>
                  </div>
                ))}
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};
