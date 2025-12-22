import React from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';

export const WorkOrderDetailView = ({ order, onEdit }: any) => {
  if (!order) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-6 text-stone-200">
       <div className="p-8 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Terminal size={80} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Work Order</Typography>
          <Typography variant="bodySmall" className="text-stone-200 font-bold uppercase tracking-tight mt-1">Choose an active production run to track progress</Typography>
       </div>
    </div>
  );

  const MOCK_LOGS = [
    { time: '14:20', task: 'Machine Calibration', status: 'Passed', op: 'Ramesh K.' },
    { time: '11:10', task: 'Block Loading (G1)', status: 'Success', op: 'Amit S.' },
    { time: '09:45', task: 'Pre-Production Audit', status: 'Verified', op: 'System' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 @container pb-32">
       <EntityDetailHeader 
         id={order.id}
         title={order.name}
         subtitle="Active Production Node"
         status={<Chip label={order.status} className={cn("h-5 text-[8px] font-black uppercase rounded-xs border-none px-2", order.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")} />}
         actions={
           <>
             <Button variant="outlined" size="md" icon={<Icons.Adjust size={18} />} className="font-black">PAUSE</Button>
             <Button variant="filled" size="md" icon={<Icons.Check size={18} />} className="shadow-1 font-black">COMPLETE</Button>
           </>
         }
       />

       <div className="p-6 @md:p-10 flex flex-col gap-10">
          <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-8">
              <Card variant="filled" className="bg-stone-900 text-white p-8 rounded-xs @2xl:col-span-2 flex flex-col justify-between h-[220px] shadow-3 border-none relative overflow-hidden">
                  <div className="relative z-10 flex justify-between items-start">
                     <div>
                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-[0.2em]">Real-time Yield Progress</Typography>
                        <Typography variant="displaySmall" className="font-black text-white mt-4 tracking-tighter leading-none">{order.progress}%</Typography>
                        <Typography variant="labelSmall" className="text-emerald-400 font-black uppercase mt-2 block tracking-tight">Sync Status: Active</Typography>
                     </div>
                     <div className="w-16 h-16 rounded-xs bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icons.Terminal size={32} className="text-amber-500" />
                     </div>
                  </div>
                  <div className="relative z-10 flex flex-col gap-3">
                     <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-emphasized" style={{ width: `${order.progress}%` }} />
                     </div>
                     <div className="flex justify-between text-[10px] font-black text-stone-500 uppercase tracking-widest">
                        <span>INITIATED: 22 OCT</span>
                        <span>EST. END: {order.deadline}</span>
                     </div>
                  </div>
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />
              </Card>

              <Card variant="outlined" className="bg-white border-stone-200 p-6 flex flex-col justify-between h-[220px] rounded-xs shadow-sm">
                 <div>
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest block mb-4">Production Hub</Typography>
                    <Typography variant="titleLarge" className="font-black text-stone-900 uppercase leading-tight">Secondary Sawing Line (L2)</Typography>
                    <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-2 block">Terminal 2 Warehouse</Typography>
                 </div>
                 <div className="pt-4 border-t border-stone-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase">Supervisor</span>
                    <span className="text-[11px] font-black text-stone-800 uppercase">{order.supervisor}</span>
                 </div>
              </Card>
          </div>

          <section className="flex flex-col gap-6">
             <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-1">Sequence Audit Log</Typography>
             <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50 border-b border-stone-200">
                            <TableHead className="py-4">Timestamp</TableHead>
                            <TableHead>Protocol Step</TableHead>
                            <TableHead>Technician</TableHead>
                            <TableHead className="text-right">Outcome</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_LOGS.map((log, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-50 transition-colors">
                                <TableCell className="py-4 font-mono text-[11px] text-stone-400 font-black uppercase">{log.time}</TableCell>
                                <TableCell className="font-black text-stone-800 uppercase text-[12px]">{log.task}</TableCell>
                                <TableCell className="font-bold text-stone-500 uppercase text-[11px]">{log.op}</TableCell>
                                <TableCell className="text-right">
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xs border border-emerald-100">{log.status}</span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="outlined" className="p-8 border-stone-200 bg-stone-50/30 rounded-xs">
                  <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest block mb-4">Input Load Analysis</Typography>
                  <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-600 uppercase">Raw Blocks Assigned</span>
                          <span className="text-xs font-black text-stone-900">4 UNITS</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-600 uppercase">Consumables Staged</span>
                          <span className="text-xs font-black text-stone-900">85% READY</span>
                      </div>
                  </div>
              </Card>
              <Card variant="outlined" className="p-8 border-stone-200 bg-stone-50/30 rounded-xs flex flex-col items-center justify-center text-center gap-2 group hover:bg-stone-900 hover:text-white transition-all cursor-pointer">
                  <Icons.Adjust size={32} className="text-stone-300 group-hover:text-amber-500 transition-colors" />
                  <Typography variant="labelSmall" className="font-black uppercase tracking-[0.2em]">Manual Override Protocol</Typography>
                  <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Emergency Stop / Adjust Load</Typography>
              </Card>
          </section>
       </div>
    </div>
  );
};