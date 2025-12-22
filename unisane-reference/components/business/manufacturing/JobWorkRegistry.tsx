import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { RegistryHeader, RegistryList, RegistryContainer } from '../shared/RegistryComponents';
import { Icon } from '../../ui/Icon';

const MOCK_JOB_WORK = [
  { id: 'JW-OUT-442', vendor: 'Global Polishing Ltd', item: 'Granite Raw Slabs', qty: '450 SqFt', status: 'In-Transit', date: '26 Oct', type: 'Outward' },
  { id: 'JW-IN-102', vendor: 'Precision Cutting Co', item: 'Marble Blocks', qty: '12 Units', status: 'Processing', date: '24 Oct', type: 'Outward' },
  { id: 'JW-RCV-005', vendor: 'Thane Finishers', item: 'Polished Tiles', qty: '200 Pcs', status: 'Received', date: '22 Oct', type: 'Inward' },
];

export const JobWorkRegistry = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          variant="full"
          label="Extended Factory"
          title="Job Work & Sub-contracting"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search challans or vendors..."
          action={
            <div className="flex gap-2">
                <Button variant="outlined" size="md" icon={<Icon symbol="local_shipping" size={18} />} className="font-black text-[10px] bg-white">ISSUE CHALLAN</Button>
                <Button variant="filled" size="md" icon={<Icons.Add />} className="shadow-2 font-black text-[10px] px-6">RECORD RECEIPT</Button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-50/20">
            <div className="max-w-6xl mx-auto flex flex-col gap-10">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="outlined" className="p-6 bg-white border-stone-200">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Material at Vendors</Typography>
                        <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">1,450 SqFt</Typography>
                        <span className="text-[10px] font-bold text-amber-600 uppercase mt-2 block">Value: ₹12.4L</span>
                    </Card>
                    <Card variant="outlined" className="p-6 bg-white border-stone-200">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Pending Processing</Typography>
                        <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">8 Contracts</Typography>
                        <span className="text-[10px] font-bold text-stone-400 uppercase mt-2 block">Avg Lag: 4 Days</span>
                    </Card>
                    <Card variant="filled" className="p-6 bg-stone-900 text-white border-none shadow-2">
                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase text-[9px]">Inward Quality Pass</Typography>
                        <Typography variant="headlineSmall" className="font-black text-emerald-400 mt-2">98.2%</Typography>
                        <span className="text-[10px] font-bold text-stone-500 uppercase mt-2 block">ISO Protocol Met</span>
                    </Card>
                </div>

                <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-stone-50 border-b border-stone-200">
                                <TableHead>Challan / Type</TableHead>
                                <TableHead>Sub-contractor</TableHead>
                                <TableHead>Material Detail</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Execution Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_JOB_WORK.map((jw, i) => (
                                <TableRow key={i} className="hover:bg-stone-50 transition-colors">
                                    <TableCell className="py-5">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-primary font-black text-[11px]">{jw.id}</span>
                                            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-1">{jw.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-black text-stone-800 uppercase text-[12px]">{jw.vendor}</TableCell>
                                    <TableCell className="font-bold text-stone-500 uppercase text-[11px]">{jw.item}</TableCell>
                                    <TableCell className="text-right font-black text-stone-900 tabular-nums">{jw.qty}</TableCell>
                                    <TableCell className="text-right text-stone-400 font-bold uppercase text-[10px]">{jw.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Chip 
                                            label={jw.status} 
                                            className={cn(
                                                "h-5 text-[8px] font-black uppercase rounded-xs border-none px-2",
                                                jw.status === 'Received' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                            )} 
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    </div>
  );
};