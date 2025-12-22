import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Icon } from '../../ui/Icon';
import { cn } from '../../../lib/utils';
import { RegistryHeader } from '../shared/RegistryComponents';

const COA_STRUCTURE = [
  { id: '1000', name: 'ASSETS', type: 'Root', children: [
    { id: '1100', name: 'Current Assets', children: [
      { id: '1110', name: 'Bank Accounts', children: [] },
      { id: '1120', name: 'Inventory Assets', children: [] }
    ]},
    { id: '1200', name: 'Fixed Assets', children: [] }
  ]},
  { id: '2000', name: 'LIABILITIES', type: 'Root', children: [
    { id: '2100', name: 'Current Liabilities', children: [] }
  ]},
  { id: '3000', name: 'INCOME', type: 'Root', children: [] },
  { id: '4000', name: 'EXPENSES', type: 'Root', children: [] }
];

export const ChartOfAccounts = () => {
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
      <RegistryHeader 
        variant="full"
        label="Accounting Core"
        title="Chart of Accounts"
        hideSearch
        action={
          <Button variant="filled" size="md" icon={<Icons.Add />} className="font-black text-[10px] px-8 shadow-2">NEW HEAD</Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xs flex items-start gap-4 mb-6">
            <Icon symbol="info" className="text-emerald-600 mt-0.5" size={20} />
            <Typography variant="bodySmall" className="text-emerald-800 font-bold uppercase leading-relaxed">
              Standard Double-Entry structure enforced. Root accounts are locked for tenant integrity.
            </Typography>
          </div>

          <div className="flex flex-col gap-2">
            {COA_STRUCTURE.map(root => (
              <div key={root.id} className="flex flex-col">
                <div className="flex items-center justify-between p-5 bg-stone-900 text-white rounded-xs mb-1">
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono text-stone-500 font-black">{root.id}</span>
                      <Typography variant="titleMedium" className="font-black tracking-tight">{root.name}</Typography>
                   </div>
                   <Button variant="text" size="sm" className="text-primary font-black text-[9px]">EXPAND</Button>
                </div>
                <div className="pl-8 flex flex-col gap-1 mt-1 mb-6">
                   {root.children.map(child => (
                     <div key={child.id} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xs group hover:border-primary/40 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-primary transition-colors" />
                           <span className="text-[10px] font-mono text-stone-400 font-bold">{child.id}</span>
                           <span className="text-xs font-black text-stone-800 uppercase">{child.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="text" size="sm" className="text-[9px] font-black text-stone-400">ADD SUB</Button>
                           <Button variant="text" size="sm" className="text-[9px] font-black text-primary">EDIT</Button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};