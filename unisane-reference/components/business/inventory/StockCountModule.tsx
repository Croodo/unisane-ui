import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { Icon } from '../../ui/Icon';
import { RegistryHeader } from '../shared/RegistryComponents';

const MOCK_SESSIONS = [
  { id: 'CNT-101', warehouse: 'Main Godown', date: '26 Oct 2023', status: 'In-Progress', items: 120, variance: 'TBD' },
  { id: 'CNT-100', warehouse: 'Showroom', date: '20 Oct 2023', status: 'Finalized', items: 45, variance: '+₹2,400' },
];

export const StockCountModule = () => {
  const [search, setSearch] = useState('');
  
  const filtered = MOCK_SESSIONS.filter(s => 
    s.warehouse.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search)
  );

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          variant="full"
          label="Audit Protocol"
          title="Physical Stock Counts"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search sessions or locations..."
          action={
            <Button variant="filled" size="md" icon={<Icons.Add />} className="shadow-2 font-black px-6 text-[10px]">
                NEW COUNT SESSION
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-stone-50">
                                    <TableHead>Protocol ID</TableHead>
                                    <TableHead>Warehouse Hub</TableHead>
                                    <TableHead>Audit Date</TableHead>
                                    <TableHead>Current Status</TableHead>
                                    <TableHead className="text-right">Valuation Variance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-stone-50 cursor-pointer group transition-colors">
                                        <TableCell className="font-black text-primary py-5 tabular-nums">{s.id}</TableCell>
                                        <TableCell className="font-black text-stone-800 uppercase text-[11px]">{s.warehouse}</TableCell>
                                        <TableCell className="text-stone-400 font-bold uppercase text-[10px]">{s.date}</TableCell>
                                        <TableCell>
                                            <Chip label={s.status} className={cn(
                                                "h-5 text-[8px] font-black uppercase rounded-xs border-none",
                                                s.status === 'Finalized' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                            )} />
                                        </TableCell>
                                        <TableCell className="text-right font-black text-stone-900 tabular-nums">{s.variance}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 text-stone-200 opacity-40">
                                            <Typography variant="labelSmall" className="font-black uppercase">No sessions found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <Card variant="filled" className="bg-stone-900 text-white p-8 rounded-xs border-none shadow-3 relative overflow-hidden group">
                        <div className="relative z-10">
                            <Typography variant="labelSmall" className="text-primary-container font-black uppercase tracking-widest">Inventory Integrity</Typography>
                            <Typography variant="titleLarge" className="font-black mt-4 leading-tight uppercase">Audit Required</Typography>
                            <Typography variant="bodySmall" className="text-stone-500 font-bold mt-2 uppercase text-[11px] leading-relaxed">
                                "Main Godown" has not been physicaly counted in 45 days. Re-sync protocol suggested.
                            </Typography>
                        </div>
                        <Icon symbol="warning" className="absolute -bottom-4 -right-4 text-primary-container opacity-10" size={120} />
                    </Card>

                    <Card variant="outlined" className="bg-stone-50 border-stone-200 p-8 rounded-xs">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Last Reconciliation Impact</Typography>
                        <div className="flex items-baseline gap-2 mt-4">
                            <Typography variant="headlineSmall" className="font-black text-emerald-600">₹2,400</Typography>
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Surplus Adjusted</span>
                        </div>
                        <Button variant="tonal" size="md" className="w-full mt-8 font-black text-[10px] h-11 bg-white border border-stone-200 text-stone-700 shadow-sm">VIEW FULL AUDIT LOGS</Button>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};