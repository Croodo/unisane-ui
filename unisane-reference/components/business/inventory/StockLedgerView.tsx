
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { RegistryHeader } from '../shared/RegistryComponents';

const MOCK_LEDGER_ENTRIES = [
    { date: '26 Oct 2023', time: '14:20', item: 'Granite Slab (Grey)', ref: 'INV-1002', type: 'Sales Out', qty: -45, unit: 'SqFt', warehouse: 'Main Godown', balance: 450 },
    { date: '26 Oct 2023', time: '11:10', item: 'Premium Cement', ref: 'ADJ-441', type: 'Adjustment', qty: +10, unit: 'Bag', warehouse: 'Terminal 2', balance: 120 },
    { date: '25 Oct 2023', time: '10:05', item: 'TMT Bar 16mm', ref: 'PB-991', type: 'Purchase In', qty: +500, unit: 'Kg', warehouse: 'Main Godown', balance: 5000 },
    { date: '25 Oct 2023', time: '09:45', item: 'Granite Slab (Grey)', ref: 'TRF-001', type: 'Transfer Out', qty: -20, unit: 'SqFt', warehouse: 'Main Godown', balance: 495 },
];

export const StockLedgerView = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          label="Transactional Truth"
          title="Stock Ledger"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter by Item or Ref..."
          action={
            <Button variant="filled" size="md" icon={<Icons.File />} className="bg-stone-900 text-white shadow-2 font-black text-[10px] px-8">EXPORT LEDGER</Button>
          }
          subHeader={
            <Button variant="outlined" size="md" icon={<Icons.Filter />} className="bg-white font-black text-[10px] h-10 @md:h-12 px-8 shadow-sm">ADVANCED FILTERS</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50">
                            <TableHead className="w-32">Date & Time</TableHead>
                            <TableHead>Item Identity</TableHead>
                            <TableHead>Voucher Ref</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Movement Type</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Running Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_LEDGER_ENTRIES.map((entry, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-50">
                                <TableCell className="py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-stone-900 tabular-nums">{entry.date}</span>
                                        <span className="text-[10px] font-bold text-stone-400">{entry.time}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-stone-800 uppercase text-[12px]">{entry.item}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-mono text-primary font-bold uppercase">{entry.ref}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[11px] font-bold text-stone-500 uppercase">{entry.warehouse}</span>
                                </TableCell>
                                <TableCell>
                                    <Chip label={entry.type} className={cn(
                                        "h-5 text-[8px] font-black uppercase rounded-xs border-none",
                                        entry.qty > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                    )} />
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right font-black tabular-nums",
                                    entry.qty > 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {entry.qty > 0 ? `+${entry.qty}` : entry.qty} {entry.unit}
                                </TableCell>
                                <TableCell className="text-right font-black text-stone-900 tabular-nums">
                                    {entry.balance.toLocaleString()} {entry.unit}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
};
