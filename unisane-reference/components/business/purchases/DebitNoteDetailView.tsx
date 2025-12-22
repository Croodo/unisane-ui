import React from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';

export const DebitNoteDetailView = ({ note, onEdit }: any) => {
  if (!note) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-6 text-stone-200">
       <div className="p-8 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Purchases size={80} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Return Note</Typography>
          <Typography variant="bodySmall" className="text-stone-200 font-bold uppercase tracking-tight mt-1">Select a Debit Note to view return audit</Typography>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 @container pb-20">
      <EntityDetailHeader 
        id={note.id}
        title={note.party}
        subtitle="Purchase Return Record"
        status={<Chip label="Return Document" className="h-6 text-[9px] font-black uppercase rounded-xs border-none bg-rose-50 text-rose-700 px-3" />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icon symbol="print" size={18} />} className="rounded-xs font-black">VOUCHER</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={18} />} onClick={onEdit} className="rounded-xs shadow-1 font-black">EDIT NOTE</Button>
          </>
        }
      />

      <div className="p-4 @md:p-10 flex flex-col gap-10">
         {/* Return Summary */}
         <Card variant="filled" className="bg-rose-50 border border-rose-100 p-8 flex flex-col gap-4 rounded-xs">
            <div className="flex items-center gap-3">
               <Icon symbol="assignment_return" className="text-rose-600" />
               <Typography variant="labelSmall" className="text-rose-600 font-black uppercase tracking-widest">Financial Outward Adjustment</Typography>
            </div>
            <div className="flex justify-between items-end">
               <div>
                  <Typography variant="headlineMedium" className="font-black text-stone-900 tabular-nums">₹{note.amount.toLocaleString()}</Typography>
                  <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-1">Deducted from {note.party}'s ledger</Typography>
               </div>
               <div className="text-right">
                  <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Original Ref</Typography>
                  <Typography variant="titleSmall" className="font-black text-stone-700">PB-2023-881</Typography>
               </div>
            </div>
         </Card>

         {/* Reason & Audit */}
         <section className="flex flex-col gap-4">
            <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest">Reason for Return</Typography>
            <div className="p-6 border border-stone-200 rounded-xs bg-white flex flex-col gap-4">
               <Typography variant="bodyMedium" className="font-bold text-stone-800 uppercase italic">
                  "Slabs delivered had micro-fissures exceeding 5% surface area tolerance. Supplier agreed to immediate return and credit note."
               </Typography>
               <div className="h-px bg-stone-100" />
               <div className="flex gap-10">
                  <div>
                    <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Inspector</span>
                    <span className="text-xs font-black text-stone-700 uppercase">Rajesh K.</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Status</span>
                    <span className="text-xs font-black text-emerald-600 uppercase">Approved by Admin</span>
                  </div>
               </div>
            </div>
         </section>
      </div>
    </div>
  );
};