import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Card } from '../../ui/Card';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { Alert } from '../../ui/Alert';

export const ImportUtility = () => {
  const [target, setTarget] = useState('items');

  return (
    <div className="flex flex-col gap-12 max-w-5xl animate-in fade-in duration-500 pb-32">
        <section className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Registry: Maintenance</Typography>
                <Typography variant="headlineSmall" className="font-black text-stone-800 uppercase tracking-tighter flex items-center gap-4">
                    <Icon symbol="publish" size={32} className="text-primary" /> Master Data Onboarding
                </Typography>
                <Typography variant="bodyLarge" className="text-stone-400 font-bold uppercase text-[11px] leading-relaxed">
                    Bulk reconcile your physical assets and partner registries via structural data injections.
                </Typography>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { id: 'items', label: 'Item Master Registry', icon: <Icons.Inventory />, desc: 'Bulk import products, variants, and opening stock layers.' },
                    { id: 'parties', label: 'Partner Hub Entities', icon: <Icons.Parties />, desc: 'Import customers and suppliers with statutory IDs and balances.' },
                ].map(opt => (
                    <Card 
                        key={opt.id}
                        variant="outlined" 
                        interactive
                        onClick={() => setTarget(opt.id)}
                        className={cn(
                            "p-8 bg-white border-stone-200 transition-all rounded-xs shadow-none group",
                            target === opt.id ? "ring-2 ring-primary border-transparent bg-stone-50" : "hover:border-primary/40 hover:bg-stone-50/50"
                        )}
                    >
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "w-14 h-14 rounded-xs flex items-center justify-center transition-all duration-500 shadow-sm shrink-0", 
                                target === opt.id ? "bg-stone-900 text-primary scale-110" : "bg-stone-100 text-stone-400"
                            )}>
                                {opt.icon}
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <Typography variant="titleMedium" className="font-black text-stone-900 uppercase truncate leading-none">{opt.label}</Typography>
                                <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-1 leading-snug tracking-tight text-[11px]">{opt.desc}</Typography>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </section>

        <section className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-xs blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative p-16 border-2 border-dashed border-stone-200 rounded-xs bg-white flex flex-col items-center justify-center text-center gap-8 group-hover:border-primary transition-all duration-500 cursor-pointer shadow-sm">
                <div className="w-24 h-24 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-primary transition-all duration-500 shadow-inner">
                    <Icon symbol="upload_file" size={48} strokeWidth={1} />
                </div>
                <div className="flex flex-col gap-2">
                    <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter">Injection Surface</Typography>
                    <Typography variant="bodyMedium" className="text-stone-400 font-bold uppercase tracking-tight text-sm">
                        DRAG AND DROP CSV / EXCEL ARCHIVES HERE
                    </Typography>
                    <span className="text-[10px] font-black text-stone-300 uppercase mt-2">Maximum payload: 50MB per instance</span>
                </div>
                <Button variant="tonal" size="md" className="bg-stone-100 text-stone-900 border border-stone-200 font-black h-12 px-12 rounded-xs shadow-sm group-hover:text-white transition-all">BROWSE FILE SYSTEM</Button>
            </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { l: 'Structure Verification', s: 'Wait', c: 'text-stone-300', icon: 'rule' },
                { l: 'Data Sanitization', s: 'Wait', c: 'text-stone-300', icon: 'cleaning_services' },
                { l: 'Registry Commit', s: 'Wait', c: 'text-stone-300', icon: 'save' },
            ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 p-5 border border-stone-100 rounded-xs bg-white shadow-sm">
                    <Icon symbol={step.icon} className={step.c} size={24} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{step.l}</span>
                        <span className="text-[11px] font-black text-stone-900 uppercase mt-0.5">{step.s}</span>
                    </div>
                </div>
            ))}
        </div>

        <Alert variant="info" title="System Guidance: Data Blueprint Compliance">
            <div className="flex flex-col gap-2">
                <p>Registry commit requires adherence to the <span className="font-black underline text-primary">Stone Edition v1.0.0 Schema</span>. Critical columns detected by automated audit:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {['IDENTITY_ID', 'VALUATION_UNIT', 'GST_SLAB', 'STOCK_LEVEL_WH'].map(col => (
                        <span key={col} className="px-2 py-1 bg-stone-900 text-primary-container text-[8px] font-mono font-black uppercase rounded-xs">{col}</span>
                    ))}
                </div>
            </div>
        </Alert>
    </div>
  );
};