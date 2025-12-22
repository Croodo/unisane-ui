
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { LinearProgress } from '../../ui/Progress';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
// Added missing Button import to resolve "Cannot find name 'Button'" error on line 77
import { Button } from '../../ui/Button';

export const EInvoiceMonitor = () => {
  return (
    <div className="flex flex-col gap-10u @container animate-in fade-in duration-500 pb-32">
        <section className="flex flex-col gap-8u">
          <header className="flex items-center gap-4u border-b border-stone-100 pb-4u">
            <div className="w-1.5 h-10 bg-primary rounded-full" />
            <div className="flex flex-col">
              <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter leading-none">Statutory Digital Gateway</Typography>
              <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase mt-1">Real-time GSTN API Monitoring</Typography>
            </div>
          </header>
          
          <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-8u">
             <Card variant="filled" className="bg-stone-900 text-white p-8u md:p-12u rounded-xs border-none shadow-3 flex flex-col gap-10u relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-start">
                   <div className="flex flex-col gap-1u">
                      <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">API Status: GSTN Bridge</Typography>
                      <div className="flex items-center gap-3u">
                         <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                         <span className="text-[12px] font-black text-emerald-400 tracking-[0.2em]">OPERATIONAL</span>
                      </div>
                   </div>
                   <div className="w-16 h-16 rounded-xs bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon symbol="lan" size={32} className="text-primary-container" />
                   </div>
                </div>

                <div className="relative z-10 flex flex-col gap-4u">
                   <div className="flex items-baseline gap-4u">
                      <Typography variant="displaySmall" className="font-black text-white leading-none tracking-tighter">45ms</Typography>
                      <Typography variant="labelLarge" className="text-stone-500 font-black uppercase tracking-widest">Latency (P99)</Typography>
                   </div>
                   <LinearProgress value={15} className="bg-white/10 h-2 rounded-full" />
                </div>

                <div className="relative z-10 p-5u bg-white/5 border border-white/10 rounded-xs">
                   <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase leading-relaxed tracking-tight">
                      Authentication session is valid. System will execute automatic token renewal in 42 hours.
                   </Typography>
                </div>
                
                <Icon symbol="hub" size={240} className="absolute -right-20 -bottom-20 opacity-5 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000" />
             </Card>

             <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4u">
                {[
                  { l: 'E-Invoices Pushed', v: '142', s: 'Synced', c: 'text-stone-900' },
                  { l: 'E-Way Bills Generated', v: '38', s: 'Authorized', c: 'text-stone-900' },
                  { l: 'Gateway Queue Status', v: 'Clear', s: 'No Backlog', c: 'text-emerald-600' },
                  { l: 'Security Anomalies', v: '0', s: 'Audit Passed', c: 'text-rose-600', bc: 'border-l-4 border-l-rose-500' },
                ].map((stat, i) => (
                  <div key={i} className={cn("p-8u border border-stone-200 rounded-xs bg-white flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all", stat.bc)}>
                     <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px]">{stat.l}</Typography>
                     <div className="mt-4u flex flex-col gap-1u">
                        <Typography variant="headlineSmall" className={cn("font-black tracking-tighter leading-none", stat.c)}>{stat.v}</Typography>
                        <span className="text-[10px] font-bold text-stone-300 uppercase mt-2 block">{stat.s}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        <section className="flex flex-col gap-6u">
           <header className="flex justify-between items-center px-2u">
              <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-[0.3em]">Bridge Audit Log</Typography>
              <Button variant="text" size="sm" className="text-primary font-black text-[10px]">VIEW FULL LOG ARCHIVE</Button>
           </header>
           <div className="flex flex-col gap-2u">
              {[
                  { time: '14:20:05', doc: 'INV-1002', msg: 'IRN Generated Successfully', status: 'Success', details: 'Transaction signed by portal' },
                  { time: '11:10:12', doc: 'DC-005', msg: 'e-Way Bill Issued (MH-04-XX)', status: 'Success', details: 'Transporter ID: TRANS-991' },
                  { time: '09:45:00', doc: 'INV-1001', msg: 'Statutory Snapshot Archived', status: 'Success', details: 'Internal ledger lock applied' },
              ].map((log, i) => (
                  <div key={i} className="flex flex-col @md:flex-row @md:items-center justify-between p-6u bg-white border border-stone-100 rounded-xs group hover:border-primary/20 transition-all shadow-none hover:shadow-sm">
                      <div className="flex items-center gap-6u">
                         <div className="w-12 h-12 bg-stone-50 rounded-xs flex flex-col items-center justify-center shrink-0 border border-stone-100">
                            <span className="text-[10px] font-mono text-stone-400 font-bold">{log.time.split(':')[0]}</span>
                            <span className="text-[8px] font-mono text-stone-300 uppercase leading-none">{log.time.split(':')[1]}m</span>
                         </div>
                         <div className="flex flex-col gap-0.5u min-w-0">
                            <span className="text-sm font-black text-stone-900 uppercase truncate">{log.msg}</span>
                            <div className="flex items-center gap-3u">
                                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Reference: {log.doc}</span>
                                <span className="hidden @sm:inline text-[10px] font-bold text-stone-400 uppercase">• {log.details}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex justify-end mt-4u @md:mt-0">
                        <Chip label={log.status} className="h-6 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-none px-4 rounded-xs" />
                      </div>
                  </div>
              ))}
           </div>
        </section>
    </div>
  );
};
