import React from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';

export const PurchaseOrderDetailView = ({ order, onEdit }: any) => {
  if (!order) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-6 text-stone-200">
       <div className="p-8 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Purchases size={80} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Order</Typography>
          <Typography variant="bodySmall" className="text-stone-200 font-bold uppercase tracking-tight mt-1">Select a Purchase Order to view commitment details</Typography>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 @container pb-20">
      <EntityDetailHeader 
        id={order.id}
        title={order.party}
        subtitle="Purchase Order Commitment"
        status={<Chip label={order.status} className={cn("h-6 text-[9px] font-black uppercase rounded-xs border-none", order.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')} />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icon symbol="send" size={18} />} className="rounded-xs font-black">SEND TO VENDOR</Button>
            <Button variant="tonal" size="md" icon={<Icon symbol="inventory" size={18} />} className="rounded-xs font-black">CONVERT TO BILL</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={18} />} onClick={onEdit} className="rounded-xs shadow-2 font-black">EDIT ORDER</Button>
          </>
        }
      />

      <div className="p-4 @md:p-10 flex flex-col gap-8">
         {/* Order Overview */}
         <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-6">
            <Card variant="filled" className="bg-stone-50 border border-stone-200 p-6 rounded-xs @2xl:col-span-2">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest mb-1 block">Vendor Commitment</Typography>
                <Typography variant="titleLarge" className="font-black text-stone-900 uppercase">{order.party}</Typography>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100">
                    <div>
                        <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Expected By</span>
                        <span className="text-[12px] font-black text-stone-700 uppercase">{order.expectedDate}</span>
                    </div>
                    <div className="w-px h-8 bg-stone-200" />
                    <div>
                        <span className="text-[9px] font-black text-stone-400 uppercase block mb-1">Total Valuation</span>
                        <span className="text-[12px] font-black text-stone-900 uppercase tabular-nums">₹{order.amount.toLocaleString()}</span>
                    </div>
                </div>
            </Card>

            <Card variant="filled" className="bg-stone-900 text-white p-6 rounded-xs border-none shadow-2 flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-start">
                    <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">Delivery Risk</Typography>
                    <Icon symbol="local_shipping" className="text-amber-500" />
                </div>
                <Typography variant="titleMedium" className="font-bold text-stone-300 italic leading-relaxed">
                    "Historical lead time for this vendor is 4 days. Expected on track."
                </Typography>
            </Card>
         </div>

         {/* Document Display (Simulated) */}
         <div className="w-full bg-stone-50 border border-stone-200 p-8 @md:p-12 min-h-[600px] flex flex-col gap-10 shadow-sm">
             <div className="flex justify-between">
                <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase">PURCHASE ORDER</Typography>
                <div className="text-right">
                    <Typography variant="labelSmall" className="font-black uppercase text-stone-400">Order Ref</Typography>
                    <Typography variant="titleMedium" className="font-black text-stone-800 uppercase">{order.id}</Typography>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-10">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase">Billing To</span>
                    <span className="font-black text-sm uppercase">Unisane Industrial Slabs</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase leading-relaxed">Bhiwandi Hub, Sector 5, Thane</span>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase">Supplier Details</span>
                    <span className="font-black text-sm uppercase">{order.party}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase leading-relaxed">Corporate Office, Mumbai Central</span>
                </div>
             </div>
             
             {/* Lines Table Placeholder */}
             <div className="flex flex-col border border-stone-200">
                <div className="grid grid-cols-[1fr_80px_120px] bg-stone-100 p-4 border-b border-stone-200">
                    <span className="text-[10px] font-black uppercase text-stone-500">Item description</span>
                    <span className="text-[10px] font-black uppercase text-stone-500 text-right">Qty</span>
                    <span className="text-[10px] font-black uppercase text-stone-500 text-right">Total</span>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-[1fr_80px_120px]">
                        <span className="text-xs font-black uppercase text-stone-700">Hard Rock Slabs (Sample)</span>
                        <span className="text-xs font-bold text-stone-500 text-right">10</span>
                        <span className="text-xs font-black text-stone-900 text-right tabular-nums">₹{order.amount.toLocaleString()}</span>
                    </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};