import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { RegistryHeader } from '../shared/RegistryComponents';

const DAY_BOOK_ENTRIES = [
    { id: 'INV-1002', type: 'Sales Invoice', entity: 'Elite Builders', amount: 45000, flow: 'IN', time: '14:20' },
    { id: 'PAY-441', type: 'Payment Rec.', entity: 'Raj Construction', amount: 12000, flow: 'IN', time: '11:10' },
    { id: 'PB-991', type: 'Purchase Bill', entity: 'Stone Mines India', amount: 88000, flow: 'OUT', time: '10:05' },
    { id: 'EXP-101', type: 'Expense Voucher', entity: 'Petrol & Fuel', amount: 1200, flow: 'OUT', time: '09:45' },
];

export const DayBookView = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          variant="full"
          label="System Timeline"
          title="Day Book"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search entry or ref..."
          action={
            <div className="flex gap-2">
                <Button variant="outlined" size="md" className="bg-white font-black text-[10px]">26 OCT 2023</Button>
                <Button variant="filled" size="md" icon={<Icons.File />} className="shadow-2 font-black text-[10px] px-6">PRINT DAY BOOK</Button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-stone-50 border border-stone-200 p-5 rounded-xs">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Receipts</Typography>
                    <Typography variant="titleLarge" className="font-black text-emerald-600 mt-1">₹57,000</Typography>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 rounded-xs">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Payments</Typography>
                    <Typography variant="titleLarge" className="font-black text-rose-600 mt-1">₹89,200</Typography>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-5 rounded-xs">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Closing</Typography>
                    <Typography variant="titleLarge" className="font-black text-stone-900 mt-1">₹42,100</Typography>
                </div>
                <div className="bg-stone-900 text-white p-5 rounded-xs shadow-1">
                    <Typography variant="labelSmall" className="text-stone-500 font-black uppercase text-[9px]">Net Flow</Typography>
                    <Typography variant="titleLarge" className="font-black text-rose-400 mt-1">-₹32,200</Typography>
                </div>
            </div>

            <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50">
                            <TableHead className="w-24">Time</TableHead>
                            <TableHead>Reference / Particulars</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Inflow (+)</TableHead>
                            <TableHead className="text-right">Outflow (-)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {DAY_BOOK_ENTRIES.map((entry, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-50">
                                <TableCell className="text-[11px] font-bold text-stone-400 tabular-nums">{entry.time}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col py-2">
                                        <span className="font-black text-stone-900 uppercase text-[12px]">{entry.entity}</span>
                                        <span className="text-[10px] font-mono text-primary font-bold mt-1 uppercase">{entry.id}</span>
                                    </div>
                                </TableCell>
                                <TableCell><Chip label={entry.type} className="h-5 text-[8px] font-black uppercase bg-stone-100 text-stone-600 border-none rounded-xs" /></TableCell>
                                <TableCell className="text-right font-black text-emerald-600 tabular-nums">{entry.flow === 'IN' ? `₹${entry.amount.toLocaleString()}` : '—'}</TableCell>
                                <TableCell className="text-right font-black text-rose-600 tabular-nums">{entry.flow === 'OUT' ? `₹${entry.amount.toLocaleString()}` : '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
};