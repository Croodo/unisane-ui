
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Card } from '../../ui/Card';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';

export const UnitConversionRegistry = () => {
  const [conversions] = useState([
    { base: 'Box', target: 'Pcs', factor: 24 },
    { base: 'Ton', target: 'Kg', factor: 1000 },
    { base: 'SqFt', target: 'SqInch', factor: 144 }
  ]);

  return (
    <div className="flex flex-col gap-10u @container animate-in fade-in duration-500">
       <section className="flex flex-col gap-8u">
          <header className="flex flex-col @md:flex-row justify-between items-start @md:items-end gap-6u border-b border-stone-100 pb-5u">
             <div className="flex flex-col gap-1.5u">
                <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter">Precision Mapping</Typography>
                <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase tracking-tight">Define algebraic relationships between measurement units</Typography>
             </div>
             <Button variant="filled" size="md" icon={<Icons.Add />} className="bg-stone-900 text-white font-black text-[10px] px-8u h-12u shadow-2 w-full @md:w-auto rounded-xs">NEW UOM LINK</Button>
          </header>
          
          <div className="grid grid-cols-1 gap-4u">
             {conversions.map((c, i) => (
                <div key={i} className="flex flex-col @md:flex-row items-center gap-6u p-8u bg-white border border-stone-200 rounded-xs group hover:border-primary transition-all relative overflow-hidden shadow-none hover:shadow-sm">
                    <div className="flex-1 grid grid-cols-1 @md:grid-cols-3 gap-8u items-center w-full">
                        <div className="flex flex-col gap-1.5u">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Source Identity</span>
                            <span className="text-lg font-black text-stone-900 uppercase tracking-tight">1 {c.base}</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <div className="w-full h-px bg-stone-100 relative hidden @md:block">
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-5 py-1 text-[10px] font-black text-primary uppercase italic tracking-widest border border-stone-50 rounded-full">SCALES TO</div>
                           </div>
                           <div className="@md:hidden flex items-center gap-3u text-primary opacity-40">
                              <Icon symbol="arrow_downward" size={24} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Logic Flow</span>
                           </div>
                        </div>
                        <div className="flex flex-col @md:text-right gap-1.5u">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Derived Quantity</span>
                            <span className="text-lg font-black text-emerald-600 uppercase tabular-nums tracking-tight">{c.factor} {c.target}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-end w-full @md:w-auto @md:opacity-0 @md:group-hover:opacity-100 transition-all ml-4u">
                        <IconButton variant="tonal" className="text-stone-300 hover:text-error h-11u w-11u border-stone-100 bg-stone-50 hover:bg-rose-50">
                            <Icons.Delete size={20} />
                        </IconButton>
                    </div>
                </div>
             ))}
          </div>
       </section>

       <Card variant="filled" className="bg-stone-900 border-none p-8u @md:p-10u flex items-start gap-6u rounded-xs shadow-3 overflow-hidden relative">
          <div className="p-4u rounded-xs bg-white/5 text-primary-container shrink-0 relative z-10">
            <Icons.Warning size={28} />
          </div>
          <div className="flex flex-col gap-2u relative z-10">
             <Typography variant="titleMedium" className="font-black uppercase text-primary-container tracking-tight">Computational Accuracy Policy</Typography>
             <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase leading-relaxed tracking-tight max-w-2xl">
                System enforces 4 decimal places for all industrial-grade derived quantities. Variance thresholds are managed via the <span className="underline cursor-pointer text-white hover:text-primary transition-colors">Global Fiscal Logic</span>.
             </Typography>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-5 scale-150 rotate-12 text-white">
            <Icon symbol="calculate" size={160} />
          </div>
       </Card>
    </div>
  );
};
