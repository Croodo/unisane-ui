
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Chip } from '../../ui/Chip';
import { RegistryHeader } from '../shared/RegistryComponents';

const MOCK_LEDGER = [
    { date: '26 Oct 2023', ref: 'INV-2023-101', party: 'Elite Builders', head: 'Sales', debit: 0, credit: 45000, balance: 45000, type: 'CR' },
    { date: '25 Oct 2023', ref: 'PB-2023-881', party: 'Stone Mines India', head: 'Purchases', debit: 88000, credit: 0, balance: -43000, type: 'DR' },
    { date: '24 Oct 2023', ref: 'EXP-101', party: 'Office Rent', head: 'OpEx', debit: 25000, credit: 0, balance: -68000, type: 'DR' },
    { date: '22 Oct 2023', ref: 'PAY-882', party: 'HDFC Bank', head: 'Payment In', debit: 0, credit: 15000, balance: -53000, type: 'CR' },
];

export const GeneralLedgerView = ({ onAddJournal }: any) => {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          label="System of Record"
          title="General Ledger"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by ref or party..."
          action={
            <div className="flex gap-2">
                <Button variant="outlined" size="md" icon={<Icons.File />} className="rounded-xs font-black text-[10px] bg-white">EXPORT T-ACCOUNT</Button>
                <Button variant="filled" size="md" icon={<Icons.Add />} onClick={onAddJournal} className="rounded-xs shadow-2 font-black text-[10px]">NEW JV ENTRY</Button>
            </div>
          }
          subHeader={
            <div className="flex flex-wrap gap-2">
                <Button variant="tonal" size="md" className="h-10 @md:h-12 rounded-xs font-black text-[10px] bg-white border border-stone-200 text-stone-600 px-6">DATE: 01 OCT - 31 OCT</Button>
                <Button variant="tonal" size="md" className="h-10 @md:h-12 rounded-xs font-black text-[10px] bg-white border border-stone-200 text-stone-600 px-6">ALL ACCOUNTS</Button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50 border-b border-stone-200">
                            <TableHead className="w-32">Date</TableHead>
                            <TableHead>Reference / Particulars</TableHead>
                            <TableHead>Account Head</TableHead>
                            <TableHead className="text-right">Debit (+)</TableHead>
                            <TableHead className="text-right">Credit (-)</TableHead>
                            <TableHead className="text-right">Running Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_LEDGER.map((txn, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 transition-colors group">
                                <TableCell className="text-[11px] font-bold text-stone-400 tabular-nums py-4">{txn.date}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-black text-stone-800 uppercase text-[12px]">{txn.party}</span>
                                        <span className="text-[10px] font-mono text-primary font-bold mt-1 uppercase">{txn.ref}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Chip label={txn.head} className="h-5 text-[8px] font-black uppercase rounded-xs border-none bg-stone-100 text-stone-600" />
                                </TableCell>
                                <TableCell className="text-right font-black tabular-nums text-stone-900">
                                    {txn.debit > 0 ? `₹${txn.debit.toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="text-right font-black tabular-nums text-emerald-600">
                                    {txn.credit > 0 ? `₹${txn.credit.toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={cn("font-black tabular-nums", txn.balance >= 0 ? "text-stone-900" : "text-error")}>
                                            ₹{Math.abs(txn.balance).toLocaleString()}
                                        </span>
                                        <span className="text-[7px] font-black uppercase text-stone-400">{txn.balance >= 0 ? 'CR' : 'DR'}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-8 p-6 bg-stone-900 rounded-xs flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-10">
                    <div>
                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest text-[9px]">Total Debits</Typography>
                        <Typography variant="titleLarge" className="text-white font-black tabular-nums mt-1">₹1,13,000</Typography>
                    </div>
                    <div>
                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest text-[9px]">Total Credits</Typography>
                        <Typography variant="titleLarge" className="text-white font-black tabular-nums mt-1">₹60,000</Typography>
                    </div>
                </div>
                <div className="text-center md:text-right border-l md:border-l-0 md:border-t-0 border-stone-800 pl-10 md:pl-0">
                    <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest text-[9px]">Closing Balance</Typography>
                    <Typography variant="headlineSmall" className="text-amber-500 font-black tabular-nums mt-1 tracking-tighter">₹53,000 DR</Typography>
                </div>
            </div>
        </div>
    </div>
  );
};
