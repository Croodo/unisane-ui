
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { RegistryHeader } from '../shared/RegistryComponents';
import { cn } from '../../../lib/utils';

export const SyncCenter = () => {
  const pendingCount = 3;
  
  return (
    <div className="h-full flex flex-col bg-stone-50 animate-in fade-in duration-500">
      <RegistryHeader 
        label="Resiliency Protocol"
        title="Sync & Outbox"
        hideSearch
        action={
          <div className="flex gap-3">
            <Button variant="outlined" size="md" icon={<Icons.Refresh />} className="font-black text-[10px] bg-white">FORCE RE-SYNC</Button>
            <Button variant="filled" size="md" className="font-black text-[10px] px-8 shadow-2">CLEAR CACHE</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card variant="filled" className="bg-stone-900 text-white p-8 rounded-xs flex flex-col justify-between h-[180px] border-none shadow-3">
                <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Pending Drafts</Typography>
                <Typography variant="displaySmall" className="font-black text-primary-container tabular-nums">{pendingCount}</Typography>
                <span className="text-[10px] font-black uppercase text-emerald-400">System Ready for Sync</span>
             </Card>
             <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs flex flex-col justify-between h-[180px]">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Last Handshake</Typography>
                <Typography variant="titleLarge" className="font-black text-stone-800 uppercase">2 Minutes Ago</Typography>
                <span className="text-[10px] font-black uppercase text-stone-400">Latency: 24ms (Fiber)</span>
             </Card>
             <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs flex flex-col justify-between h-[180px]">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Local Storage</Typography>
                <Typography variant="titleLarge" className="font-black text-stone-800 uppercase">4.2 MB USED</Typography>
                <span className="text-[10px] font-black uppercase text-stone-400">Capacity: 50MB Isolated</span>
             </Card>
          </div>

          <section className="flex flex-col gap-4">
             <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-1">Outgoing Queue</Typography>
             <div className="flex flex-col gap-2">
                {[
                  { id: 'INV-TEMP-01', type: 'Sales Invoice', time: '10m ago', size: '12kb', status: 'Pending' },
                  { id: 'PRT-TEMP-44', type: 'Party Registry', time: '14m ago', size: '4kb', status: 'Conflict' },
                  { id: 'EXP-TEMP-99', type: 'Expense Voucher', time: '1h ago', size: '8kb', status: 'Pending' },
                ].map(item => (
                  <div key={item.id} className="p-5 bg-white border border-stone-200 rounded-xs flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-5">
                       <div className={cn(
                         "w-10 h-10 rounded-xs flex items-center justify-center font-black",
                         item.status === 'Conflict' ? "bg-rose-100 text-rose-600" : "bg-stone-100 text-stone-400"
                       )}>
                         <Icons.Terminal size={20} />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-black text-stone-800 uppercase text-[12px]">{item.id}</span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase">{item.type} • {item.size}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <span className="text-[10px] font-black text-stone-400 uppercase">{item.time}</span>
                       <div className={cn(
                          "px-3 py-1 rounded-xs text-[9px] font-black uppercase",
                          item.status === 'Conflict' ? "bg-rose-600 text-white" : "bg-emerald-50 text-emerald-700"
                       )}>
                         {item.status}
                       </div>
                       <Button variant="text" size="md" className="font-black text-[9px] h-10 px-6">RETRY</Button>
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
