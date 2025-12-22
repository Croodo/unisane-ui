import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { IconButton } from '../../ui/IconButton';

export const BranchRegistry = () => {
  const BRANCHES = [
    { name: 'Bhiwandi HQ', gstin: '27AAACE1234F1Z5', manager: 'Ramesh K.', type: 'Warehouse & Billing', status: 'Main' },
    { name: 'Mumbai Central', gstin: '27AAACE1234F1Z5', manager: 'Surbhi M.', type: 'Showroom', status: 'Branch' },
    { name: 'Jaipur Depot', gstin: '08AAACE1234F2Z1', manager: 'Vikram S.', type: 'Stocking Point', status: 'Branch' },
  ];

  return (
    <div className="flex flex-col gap-10u @container animate-in fade-in duration-500 pb-32">
       <section className="flex flex-col gap-8u">
          <header className="flex flex-col @md:flex-row justify-between items-start @md:items-end gap-4u border-b border-stone-100 pb-6u">
             <div className="flex flex-col gap-1u">
                <Typography variant="titleLarge" className="font-black text-stone-800 uppercase tracking-tight leading-none">Organization Nodes</Typography>
                <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase tracking-tight">Manage multi-location GST compliance</Typography>
             </div>
             <Button variant="filled" size="md" icon={<Icons.Add />} className="font-black text-[10px] h-12u px-8u shadow-2 w-full @md:w-auto">
               REGISTER NEW BRANCH
             </Button>
          </header>

          <div className="grid grid-cols-1 @xl:grid-cols-2 @3xl:grid-cols-3 gap-6u">
             {BRANCHES.map((b, i) => (
                <Card key={i} variant="outlined" className="bg-white border-stone-200 rounded-xs flex flex-col group hover:border-primary transition-all shadow-none hover:shadow-2 relative overflow-hidden h-full">
                    <div className="p-6u @md:p-8u flex flex-col gap-6u flex-1">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-xs bg-stone-900 text-primary flex items-center justify-center font-black text-lg shadow-1">
                                {b.name.substring(0, 2)}
                            </div>
                            <Chip label={b.status} className={cn("h-5 text-[8px] font-black uppercase rounded-xs border-none px-3", b.status === 'Main' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500")} />
                        </div>
                        
                        <div className="flex flex-col gap-1u">
                            <Typography variant="titleLarge" className="font-black text-stone-900 uppercase leading-none truncate">{b.name}</Typography>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">GSTIN: {b.gstin}</span>
                        </div>

                        <div className="grid grid-cols-1 @md:grid-cols-2 gap-4u pt-6u border-t border-stone-50 mt-auto">
                            <div className="flex flex-col gap-0.5u">
                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Custodian</span>
                                <span className="text-[11px] font-bold text-stone-800 uppercase truncate">{b.manager}</span>
                            </div>
                            <div className="flex flex-col gap-0.5u">
                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Functional Unit</span>
                                <span className="text-[11px] font-bold text-stone-500 uppercase truncate">{b.type}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6u py-4u bg-stone-50 border-t border-stone-100 flex justify-end gap-2u opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <IconButton variant="standard" className="h-8u w-8u text-stone-400 hover:text-primary"><Icons.Edit size={18} /></IconButton>
                        <IconButton variant="standard" className="h-8u w-8u text-stone-400 hover:text-error"><Icons.Delete size={18} /></IconButton>
                    </div>
                    
                    {/* Decorative node id */}
                    <div className="absolute -right-2 -bottom-2 font-black text-[40px] text-stone-50 group-hover:text-primary/5 transition-colors pointer-events-none select-none tracking-tighter italic">
                        NODE_{i+1}
                    </div>
                </Card>
             ))}
          </div>
       </section>
    </div>
  );
};