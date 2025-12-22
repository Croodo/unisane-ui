import React from 'react';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { RegistryHeader } from '../shared/RegistryComponents';
import { Button as SystemButton } from '../../ui/Button';

const MOCK_LOGS = [
  { id: 'LOG-8821', user: 'Admin', action: 'Modified SKU Rate', entity: 'ITM001', time: '2m ago', severity: 'info' },
  { id: 'LOG-8820', user: 'Ramesh K.', action: 'Authorized Invoice', entity: 'INV-2023-101', time: '14m ago', severity: 'success' },
  { id: 'LOG-8819', user: 'System', action: 'Stock Level Alert', entity: 'ITM002', time: '1h ago', severity: 'warning' },
  { id: 'LOG-8818', user: 'Admin', action: 'Deleted Draft', entity: 'QTN-441', time: '2h ago', severity: 'error' },
];

export const ActivityStream = () => {
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          variant="full"
          label="Security Protocol"
          title="Global Activity Stream"
          hideSearch
          action={
            <SystemButton variant="outlined" size="md" icon={<Icons.Filter />} className="font-black text-[10px] bg-white">FILTER BY USER</SystemButton>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-1">
                {MOCK_LOGS.map((log) => (
                    <div key={log.id} className="flex gap-6 p-5 hover:bg-stone-50 transition-colors border-b border-stone-50 group">
                        <div className="flex flex-col items-center shrink-0">
                            <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5",
                                log.severity === 'success' ? "bg-emerald-500" : 
                                log.severity === 'warning' ? "bg-amber-500" :
                                log.severity === 'error' ? "bg-rose-500" : "bg-primary"
                            )} />
                            <div className="w-px flex-1 bg-stone-100 my-2 group-last:hidden" />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{log.id} • {log.time}</span>
                                <span className="text-[10px] font-mono text-stone-300">USER: {log.user.toUpperCase()}</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">{log.action}</Typography>
                                <span className="text-xs font-mono text-primary font-bold">{log.entity}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};