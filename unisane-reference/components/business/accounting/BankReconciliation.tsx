
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { Icon } from '../../ui/Icon';
import { RegistryHeader } from '../shared/RegistryComponents';

export const BankReconciliation = () => {
  return (
    <div className="h-full flex flex-col bg-stone-50 animate-in fade-in duration-500 @container">
      <RegistryHeader 
        label="Accounting Integrity"
        title="Bank Reconciliation"
        hideSearch
        action={
            <div className="flex gap-3">
                <Button variant="outlined" size="md" icon={<Icon symbol="upload_file" size={18} />} className="font-black text-[10px] bg-white">UPLOAD STATEMENT</Button>
                <Button variant="filled" size="md" className="font-black text-[10px] px-8 shadow-2">AUTOMATCH ENTRIES</Button>
            </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card variant="outlined" className="p-8 bg-white border-stone-200 rounded-xs shadow-sm">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase mb-4 block">Bank Statement Balance</Typography>
                <div className="flex justify-between items-end">
                   <Typography variant="headlineLarge" className="font-black text-stone-900 tabular-nums leading-none">₹2,85,400.00</Typography>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Last Synced: Today</span>
                </div>
             </Card>
             <Card variant="outlined" className="p-8 bg-white border-stone-200 rounded-xs shadow-sm border-l-4 border-l-amber-500">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase mb-4 block">Ledger Balance (Internal)</Typography>
                <div className="flex justify-between items-end">
                   <Typography variant="headlineLarge" className="font-black text-stone-900 tabular-nums leading-none">₹2,42,100.00</Typography>
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Unreconciled: ₹43,300</span>
                </div>
             </Card>
          </div>

          <div className="flex flex-col gap-4">
             <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-1">Unmatched Transactions</Typography>
             <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                   <TableHeader>
                      <TableRow className="bg-stone-50 border-b border-stone-200">
                         <TableHead>Statement Date</TableHead>
                         <TableHead>Description / Ref</TableHead>
                         <TableHead className="text-right">Withdrawal</TableHead>
                         <TableHead className="text-right">Deposit</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {[
                        { date: '25 Oct 2023', ref: 'IMPS-99210-CMS', out: 12500, in: 0, s: 'Statement Only' },
                        { date: '26 Oct 2023', ref: 'RTGS-P882-ELITE', out: 0, in: 45000, s: 'Suggested Match (95%)' },
                      ].map((row, i) => (
                        <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-100 group transition-all">
                           <TableCell className="text-[11px] font-bold text-stone-400 py-6">{row.date}</TableCell>
                           <TableCell className="font-black text-stone-800 uppercase text-[12px]">{row.ref}</TableCell>
                           <TableCell className="text-right font-black text-rose-600 tabular-nums">{row.out > 0 ? `₹${row.out.toLocaleString()}` : '—'}</TableCell>
                           <TableCell className="text-right font-black text-emerald-600 tabular-nums">{row.in > 0 ? `₹${row.in.toLocaleString()}` : '—'}</TableCell>
                           <TableCell className="text-right">
                              <div className="flex gap-2 justify-end items-center">
                                 {row.s.includes('Match') && <Chip label={row.s} className="h-5 text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border-none rounded-xs" />}
                                 <Button variant="tonal" size="md" className="font-black text-[9px] h-10 px-6">LINK TO LEDGER</Button>
                              </div>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
