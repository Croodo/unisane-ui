import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { RegistryHeader } from '../shared/RegistryComponents';

const NODES = [
  { id: 'L1', name: 'Sawing Line A', capacity: '100%', tasks: [{ name: 'WO-9921', color: 'bg-primary', span: 4 }, { name: 'WO-9922', color: 'bg-amber-500', span: 2 }] },
  { id: 'L2', name: 'Sawing Line B', capacity: '45%', tasks: [{ name: 'WO-9920', color: 'bg-emerald-500', span: 3 }] },
  { id: 'P1', name: 'Polishing Gantry', capacity: '80%', tasks: [{ name: 'WO-9918', color: 'bg-stone-900', span: 6 }] },
  { id: 'M1', name: 'Manual Finishing', capacity: '10%', tasks: [] },
];

const HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

export const ProductionSchedule = () => {
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          variant="full"
          label="Sequence Control"
          title="Production Schedule"
          hideSearch
          action={
            <div className="flex gap-2">
                <Button variant="outlined" size="md" className="bg-white font-black text-[10px]">DATE: 26 OCT 2023</Button>
                <Button variant="filled" size="md" icon={<Icons.Add />} className="shadow-2 font-black text-[10px] px-8">ASSIGN RUN</Button>
            </div>
          }
        />

        <div className="flex-1 overflow-x-auto p-6 md:p-12">
            <div className="min-w-[1000px] flex flex-col gap-px bg-stone-200 border border-stone-200 rounded-xs overflow-hidden shadow-sm">
                {/* Time Header */}
                <div className="grid grid-cols-[240px_1fr] bg-stone-50 border-b border-stone-200">
                    <div className="p-4 border-r border-stone-200 flex items-center justify-center">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Operational Node</span>
                    </div>
                    <div className="grid grid-cols-8">
                        {HOURS.map(h => (
                            <div key={h} className="p-4 text-center border-r border-stone-100 last:border-0">
                                <span className="text-[10px] font-black text-stone-500 tabular-nums">{h}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Node Rows */}
                {NODES.map(node => (
                    <div key={node.id} className="grid grid-cols-[240px_1fr] bg-white group hover:bg-stone-50/50 transition-colors">
                        <div className="p-6 border-r border-stone-200 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{node.id} PROTOCOL</span>
                            <span className="text-sm font-black text-stone-900 uppercase">{node.name}</span>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-1 flex-1 bg-stone-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full", parseInt(node.capacity) > 80 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: node.capacity }} />
                                </div>
                                <span className="text-[8px] font-black text-stone-400">{node.capacity}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-8 relative p-4 gap-2">
                            {/* Visual Grid Lines */}
                            <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                                {Array.from({length: 7}).map((_, i) => <div key={i} className="border-r border-stone-100 h-full" />)}
                            </div>
                            
                            {/* Tasks Mapping - Simplified visualization */}
                            <div className="col-span-8 flex gap-2 h-full items-center">
                                {node.tasks.map((task, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "h-12 rounded-xs flex flex-col justify-center px-4 shadow-sm animate-in zoom-in-95 duration-500",
                                            task.color, "text-white"
                                        )}
                                        style={{ width: `${(task.span / 8) * 100}%` }}
                                    >
                                        <span className="text-[10px] font-black uppercase truncate">{task.name}</span>
                                        <span className="text-[8px] opacity-70 font-black">ACTIVE</span>
                                    </div>
                                ))}
                                {node.tasks.length === 0 && (
                                    <div className="flex-1 border-2 border-dashed border-stone-100 rounded-xs flex items-center justify-center text-stone-200 italic text-[10px] uppercase font-black">
                                        Idle Node • Standard Standby
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};